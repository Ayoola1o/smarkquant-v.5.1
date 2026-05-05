try:
    import websockets
    from websockets.asyncio.client import ClientConnection
    version = getattr(websockets, '__version__', 'unknown')
    print(f'SUCCESS: websockets.asyncio is available version {version}')
except ImportError as e:
    print(f'FAILURE: {str(e)}')
except Exception as e:
    print(f'ERROR: {type(e).__name__}: {str(e)}')
