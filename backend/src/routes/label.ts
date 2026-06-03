import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import fs from 'fs';
import path from 'path';

const labelRouter = new Hono();

// 定義路徑
const DATABASE_DIR = path.join(__dirname, '../../database');
const MERGE_RULES_FILE = path.join(DATABASE_DIR, 'merge_rule.json');
const ASSOCIATION_RULES_FILE = path.join(DATABASE_DIR, 'association_rules.json');

// 確保目錄存在
if (!fs.existsSync(DATABASE_DIR)) {
    fs.mkdirSync(DATABASE_DIR, { recursive: true });
}

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
    const token = OPENCTI_TOKEN;
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
    const token = OPENCTI_TOKEN;

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

//建立自動化規則
labelRouter.get('/rule/list/:type', (c) => {
    const type = c.req.param('type');
    const filePath = type === 'merge' ? MERGE_RULES_FILE : ASSOCIATION_RULES_FILE;
    if (!fs.existsSync(filePath)) return c.json([]);
    return c.json(JSON.parse(fs.readFileSync(filePath, 'utf-8')));
});

labelRouter.post('/rule/add/:type', async (c) => {
    const type = c.req.param('type'); // 接收 'merge' 或 'association'
    const filePath = type === 'merge' ? MERGE_RULES_FILE : ASSOCIATION_RULES_FILE;

    try {
        const body = await c.req.json();
        
        if (!body.target || (type === 'merge' && !body.sources) || (type === 'association' && !body.conditions)) {
            return c.json({ error: "規則參數不完整" }, 400);
        }
        const rules = fs.existsSync(filePath) 
            ? JSON.parse(fs.readFileSync(filePath, 'utf-8')) 
            : [];
            
        rules.push({ 
            id: Date.now().toString(),
            ...body, 
            createdAt: new Date().toISOString() 
        });
        
        fs.writeFileSync(filePath, JSON.stringify(rules, null, 2));
        
        return c.json({ status: 'success', message: `規則已新增至 ${type}` });
    } catch (err: any) {
        return c.json({ error: "儲存失敗: " + err.message }, 500);
    }
});

labelRouter.put('/rule/update/:type/:id', async (c) => {
    const type = c.req.param('type');
    const id = c.req.param('id');
    const filePath = type === 'merge' ? MERGE_RULES_FILE : ASSOCIATION_RULES_FILE;
    const body = await c.req.json();

    let rules = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const index = rules.findIndex((r: any) => r.id === id);
    
    if (index === -1) return c.json({ error: "找不到該規則" }, 404);
    
    rules[index] = { ...rules[index], ...body, updatedAt: new Date().toISOString() };
    fs.writeFileSync(filePath, JSON.stringify(rules, null, 2));
    return c.json({ status: 'success' });
});

labelRouter.delete('/rule/delete/:type/:id', (c) => {
    const type = c.req.param('type');
    const id = c.req.param('id');
    const filePath = type === 'merge' ? MERGE_RULES_FILE : ASSOCIATION_RULES_FILE;

    let rules = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    rules = rules.filter((r: any) => r.id !== id);
    
    fs.writeFileSync(filePath, JSON.stringify(rules, null, 2));
    return c.json({ status: 'success' });
});

export default labelRouter;