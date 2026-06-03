import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import fs from 'node:fs';
import path from 'node:path';

const labelRouter = new Hono();

// 環境設定
const GRAPHQL_URL = 'http://localhost:8080/graphql';
const OPENCTI_TOKEN = '10b6527c-f12d-4b7d-adfa-f69d98c7a7bf';

// --- 核心邏輯函式 ---

async function getLabelIds(names: string[]) {
    const query = `
        query GetLabelIds {
            labels(
                filters: {
                    mode: and,
                    filterGroups: [],
                    filters: [{ key: "value", values: ${JSON.stringify(names)} }]
                }
            ) {
                edges { node { id value } }
            }
        }
    `;
    const response = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENCTI_TOKEN.trim()}` },
        body: JSON.stringify({ query })
    });
    const result = await response.json();
    if (result.errors) throw new Error("GraphQL 查詢失敗: " + result.errors[0].message);
    return result.data.labels.edges.map((edge: any) => edge.node);
}

async function getEntitiesByLabelIds(uuids: string[]) {
    const query = `
        query GetEntities {
            stixCoreObjects(
                filters: {
                    mode: and,
                    filterGroups: [],
                    filters: [{ key: "objectLabel", values: ${JSON.stringify(uuids)} }]
                }
            ) {
                edges {
                    node {
                        ... on StixCoreObject { id entity_type }
                    }
                }
            }
        }
    `;
    const response = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENCTI_TOKEN.trim()}` },
        body: JSON.stringify({ query })
    });
    const result = await response.json();
    if (result.errors) throw new Error("查詢實體失敗: " + result.errors[0].message);
    return result.data.stixCoreObjects.edges.map((edge: any) => edge.node);
}

async function performMutation(query: string, variables: any = {}) {
    try {
        const response = await fetch(GRAPHQL_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENCTI_TOKEN.trim()}` },
            body: JSON.stringify({ query, variables })
        });
        const result = await response.json();
        if (result.errors) throw new Error(result.errors[0].message);
        return result.data;
    } catch (error: any) {
        console.error("Mutation 執行失敗:", error.message);
        throw error;
    }
}

// --- API 路由 ---

// 1. 獲取所有標籤
labelRouter.get('/', async (c) => {
    const token = getCookie(c, 'auth_token');
    if (!token) return c.json({ error: 'Unauthorized' }, 401);

    try {
        let allLabels: any[] = [];
        let hasNextPage = true;
        let afterCursor: string | null = null;

        while (hasNextPage) {
            const graphqlQuery = {
                query: `
                    query GetLabels($first: Int, $after: ID) {
                        labels(first: $first, after: $after) {
                            edges { node { id value } }
                            pageInfo { hasNextPage endCursor }
                        }
                    }
                `,
                variables: { first: 500, after: afterCursor }
            };

            const response = await fetch(GRAPHQL_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENCTI_TOKEN}` },
                body: JSON.stringify(graphqlQuery)
            });

            const result = await response.json();
            if (result.errors) throw new Error(result.errors[0].message);

            const data = result.data.labels;
            allLabels = allLabels.concat(data.edges.map((e: any) => e.node));
            hasNextPage = data.pageInfo.hasNextPage;
            afterCursor = data.pageInfo.endCursor;
        }
        return c.json(allLabels);
    } catch (err: any) {
        return c.json({ error: err.message }, 500);
    }
});

// 2. 執行標籤合併
labelRouter.post('/merge', async (c) => {
    const token = getCookie(c, 'auth_token');
    if (!token) return c.json({ error: 'Unauthorized' }, 401);

    try {
        const { target_name, source_names } = await c.req.json();
        
        const allLabelData = await getLabelIds([...source_names, target_name]);
        const labelMap = allLabelData.reduce((acc: any, node: any) => {
            acc[node.value] = node.id;
            return acc;
        }, {});
        
        const target_uuid = labelMap[target_name];
        const source_uuids = source_names.map((name: string) => labelMap[name]).filter(Boolean);

        if (!target_uuid || source_uuids.length === 0) {
            return c.json({ error: "找不到標籤對應的 UUID，請確認名稱是否正確" }, 400);
        }

        const entityList = await getEntitiesByLabelIds(source_uuids);

        for (const entity of entityList) {
            await performMutation(`
                mutation {
                    stixCoreObjectEdit(id: "${entity.id}") {
                        relationAdd(input: { toId: "${target_uuid}", relationship_type: "object-label" }) { id }
                    }
                }
            `);
            for (const source_id of source_uuids) {
                await performMutation(`
                    mutation {
                        stixCoreObjectEdit(id: "${entity.id}") {
                            relationDelete(toId: "${source_id}", relationship_type: "object-label") { id }
                        }
                    }
                `);
            }
        }

        for (const source_id of source_uuids) {
            await performMutation(`mutation { labelEdit(id: "${source_id}") { delete } }`);
        }

        return c.json({ status: 'success', processed: entityList.length });
    } catch (err: any) {
        return c.json({ error: err.message }, 500);
    }
});



export default labelRouter;