from datetime import date, timedelta

class SearchConsoleAgent:
    def __init__(self):
        self.days = 90

    def build_query(self):
        end_date = date.today()
        start_date = end_date - timedelta(days=self.days)

        return {
            "startDate": start_date.isoformat(),
            "endDate": end_date.isoformat(),
            "dimensions": ["query"],
            "rowLimit": 1000
        }

if __name__ == "__main__":
    agent = SearchConsoleAgent()
    print(agent.build_query())
