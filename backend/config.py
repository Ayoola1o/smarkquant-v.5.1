# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# This file is used to configure your Jesse project.
# For more information, visit: https://docs.jesse.ai/
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

config = {
    # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
    # Persistence
    # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
    'databases': {
        'postgres': {
            'driver': 'postgresql',
            'host': 'localhost',
            'name': 'jesse_db',
            'user': 'jesse_user',
            'password': 'password',
            'port': 5432,
        },
        # NOTE: Your 32-bit system does not support the standard Postgres/Docker tools.
        # We are using SQLite for data ingestion, but Jesse's core backtesting engine
        # natively requires a running Postgres instance. 
    },

    'caching': {
        'driver': 'redis',
        'host': 'localhost',
        'port': 6379,
        'db': 0,
    },

    # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
    # Exchanges
    # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
    'exchanges': {
        'Binance': {
            'fee': 0.001,
            'type': 'spot',
            'name': 'Binance',
        },
        'Binance Futures': {
            'fee': 0.0002,
            'type': 'futures',
            'name': 'Binance Futures',
            'settlement_currency': 'USDT',
        },
        'yfinance': {
            'fee': 0.0,
            'type': 'spot',
            'name': 'yfinance',
        },
    },

    # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
    # Logging
    # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
    'logging': {
        'order_submission': True,
        'order_cancellation': True,
        'order_execution': True,
        'position_opened': True,
        'position_closed': True,
        'shorthand_notifications': False,
        'console_log': True,
    },

    # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
    # Optimization
    # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
    'optimization': {
        'ratio': 'sharpe',
    },
}
