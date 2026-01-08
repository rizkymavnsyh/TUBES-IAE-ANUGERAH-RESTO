import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from ariadne import make_executable_schema, load_schema_from_path, graphql_sync
from dotenv import load_dotenv
from src.database.connection import get_db_connection
from src.graphql.resolvers import resolvers
from src.auth import get_auth_context

load_dotenv()

app = FastAPI(title="Inventory Service (Python)", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load GraphQL schema
schema_path = os.path.join(os.path.dirname(__file__), "graphql", "schema.graphql")
type_defs = load_schema_from_path(schema_path)

# Create executable schema
schema = make_executable_schema(type_defs, resolvers)

@app.on_event("startup")
async def startup_event():
    """Test database connection on startup"""
    import time
    print("🚀 Inventory Service (Python/Ariadne) running on http://localhost:4002")
    print("📊 GraphQL Explorer: http://localhost:4002/graphql")
    
    max_retries = 10
    for i in range(max_retries):
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            cursor.fetchone()
            cursor.close()
            conn.close()
            print("✅ Inventory Service (Python/Ariadne): MySQL database connected")
            return
        except Exception as e:
            if i < max_retries - 1:
                time.sleep(2)
            else:
                print(f"❌ Error connecting to database: {e}")
                raise

@app.get("/")
async def root():
    return {
        "service": "Inventory Service",
        "language": "Python",
        "graphql_library": "Ariadne GraphQL",
        "status": "running",
        "graphql": "/graphql"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

# Ariadne GraphQL Explorer HTML (native GraphiQL with dark theme)
GRAPHQL_EXPLORER_HTML = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Ariadne GraphQL - Inventory Service</title>
    <link rel="icon" href="https://avatars.githubusercontent.com/u/40199982?s=200&v=4" />
    <link rel="stylesheet" href="https://unpkg.com/graphiql@3.0.9/graphiql.min.css" />
    <style>
        body {
            margin: 0;
            padding: 0;
            height: 100vh;
            width: 100vw;
            overflow: hidden;
        }
        #graphiql {
            height: 100vh;
        }
    </style>
</head>
<body>
    <div id="graphiql"></div>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/graphiql@3.0.9/graphiql.min.js"></script>
    <script>
        const fetcher = GraphiQL.createFetcher({
            url: window.location.href,
        });
        
        const root = ReactDOM.createRoot(document.getElementById('graphiql'));
        root.render(
            React.createElement(GraphiQL, {
                fetcher: fetcher,
                defaultEditorToolsVisibility: true,
            })
        );
    </script>
</body>
</html>
"""

@app.get("/graphql", response_class=HTMLResponse)
async def graphql_playground():
    """Ariadne GraphQL Explorer"""
    return GRAPHQL_EXPLORER_HTML

@app.post("/graphql")
async def graphql_server(request: Request):
    """GraphQL endpoint with auth context"""
    data = await request.json()
    auth_context = get_auth_context(request)
    success, result = graphql_sync(
        schema,
        data,
        context_value={"request": request, **auth_context},
        debug=os.getenv("DEBUG", "False").lower() == "true"
    )
    status_code = 200 if success else 400
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=4002)
