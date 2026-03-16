from jesse.strategies import Strategy, Cached
import jesse.indicators as ta

class SampleStrategy(Strategy):
    def should_long(self) -> bool:
        return False

    def should_short(self) -> bool:
        return False

    def go_long(self):
        pass

    def go_short(self):
        pass

    def should_cancel_entry(self) -> bool:
        return True

    def filters(self):
        return []
