### Loading SQL Data
Pandas can interact with SQL databases using the `read_sql()` function. You need to provide a database connection and a SQL query:

```python
import sqlite3

# Establish a connection to the database
connection = sqlite3.connect('database.db')

# Load data from a SQL query
query = 'SELECT * FROM table_name'
data = pd.read_sql(query, connection)

```

### Loading Data from APIs
Pandas can also fetch data from APIs using functions like `read_json()` and `read_csv()` by providing the API endpoint:

```python
# Load data from a JSON API
api_url = 'https://api.example.com/data'
data = pd.read_json(api_url)
```

### Loading Data from Web URLs
Pandas supports loading data directly from web URLs:
```python
# Load data from a web URL
data_url = 'https://example.com/data.csv'
data = pd.read_csv(data_url)
```

Pandas' flexibility in loading various file formats makes it a versatile tool for handling different types of data sources. Whether you're working with local files, databases, APIs, or web URLs, pandas simplifies the process of loading data for analysis and manipulation.
