## Pandas Dataframes

Pandas DataFrames are at the heart of data manipulation in Pandas. When you use functions like `pd.read_csv()` or `pd.read_sql()`, you're loading the data into a special object known as a DataFrame (abbreviated as DF). A DataFrame is a two-dimensional labeled data structure, similar to a table in a relational database or an Excel spreadsheet.

DataFrames provide a convenient and efficient way to work with structured data. They allow you to perform various operations like filtering, grouping, sorting, and aggregation with ease. Each column in a DataFrame can have a different data type (integer, float, string, etc.), and the data is organized into rows and columns.

Here's a simple example of creating a DataFrame using a native python dictionary:

```python
import pandas as pd

data = {
    'Name': ['Alice', 'Bob', 'Charlie'],
    'Age': [28, 35, 24],
    'Gender': ['Female', 'Male', 'Male']
}

df = pd.DataFrame(data)
```

If we were to then perform a print of the df, or called this new variable `df` directly, what we will see is something that looks like this:

```
>>> df
      Name  Age  Gender
0    Alice   28  Female
1      Bob   35    Male
2  Charlie   24    Male
```

This format should look familiar, it almost just looks like a native CSV or EXCEL file that you are more likely used to seeing. But with the power of pandas and python, we are able to do much more with the data then what we might be able to achive in a tool like Microsoft Excel alone.
