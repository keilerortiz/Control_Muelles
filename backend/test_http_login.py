"""
Direct HTTP test to the login endpoint to see the actual error response body.
"""
import asyncio
import aiohttp
import json

async def main():
    url = "http://127.0.0.1:8000/api/v1/auth/login"
    payload = {"email": "admin@muelles.local", "password": "12345678"}
    
    async with aiohttp.ClientSession() as session:
        async with session.post(url, json=payload) as resp:
            print(f"Status: {resp.status}")
            print(f"Headers: {dict(resp.headers)}")
            body = await resp.text()
            print(f"Body:\n{body}")
            try:
                data = json.loads(body)
                print(f"\nParsed JSON:\n{json.dumps(data, indent=2)}")
            except:
                print("(not valid JSON)")

if __name__ == "__main__":
    asyncio.run(main())
