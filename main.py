from fastapi import FastAPI, Response, status

app = FastAPI()

@app.get("/")
def read_root():
    return Response(status_code=status.HTTP_204_NO_CONTENT)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)