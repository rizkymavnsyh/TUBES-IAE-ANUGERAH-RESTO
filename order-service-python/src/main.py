import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from ariadne import make_executable_schema, load_schema_from_path
from ariadne.asgi import GraphQL
from dotenv import load_dotenv
from src.database.connection import init_db
from src.graphql.resolvers import resolvers
from src.auth import get_auth_context

load_dotenv()

app = FastAPI(title="Order Service (Python)", version="1.0.0")

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

# Context value function for GraphQL
def get_context_value(request: Request) -> dict:
    """Build context with authentication info for each request"""
    auth_context = get_auth_context(request)
    return {
        "request": request,
        **auth_context
    }

@app.on_event("startup")
async def startup_event():
    """Initialize database connection on startup"""
    import asyncio
    print("🚀 Order Service (Python/Ariadne) running on http://localhost:4004")
    print("📊 GraphQL Explorer: http://localhost:4004/graphql")
    
    max_retries = 10
    for i in range(max_retries):
        try:
            await init_db()
            print("✅ Order Service (Python/Ariadne): MySQL database connected")
            return
        except Exception as e:
            if i < max_retries - 1:
                await asyncio.sleep(2)
            else:
                print(f"❌ Error connecting to database: {e}")
                raise

@app.on_event("shutdown")
async def shutdown_event():
    """Close database connection on shutdown"""
    pass

@app.get("/")
async def root():
    return {
        "service": "Order Service",
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
    <title>Ariadne GraphQL - Order Service</title>
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

# Mount the GraphQL ASGI app for POST requests with context
graphql_app = GraphQL(
    schema, 
    debug=os.getenv("DEBUG", "False").lower() == "true",
    context_value=get_context_value
)

@app.post("/graphql")
async def graphql_server(request: Request):
    """GraphQL endpoint - handles async resolvers with auth context"""
    return await graphql_app.handle_request(request)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=4004)
