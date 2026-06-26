import { Hono } from 'hono';

const malwareRouter = new Hono();

const OPENCTI_TOKEN = process.env.OPENCTI_TOKEN;
const baseUrl = process.env.OPENCTI_URL || 'http://localhost:8080';
const GRAPHQL_URL = new URL('/graphql', baseUrl).toString();

malwareRouter.get('/', async (c) => {
  const count = parseInt(c.req.query('count') || '50');
  const cursor = c.req.query('after') || null;

  const query = `
    query GetMalwares($count: Int, $after: ID) {
      malwares(first: $count, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            id
            name
            description
          }
        }
      }
    }
  `;

  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENCTI_TOKEN}` },
    body: JSON.stringify({ query, variables: { count, after: cursor } }),
  });

  const result = await response.json();
  // 直接將整包 data.malwares 回傳，方便前端取得 pageInfo
  return c.json(result.data.malwares);
});

export default malwareRouter;