#### Loading Data with Various Options

Pandas provides a variety of options to customize how you load CSV files. Here are a few common arguments you might use with read_csv():

- `nrows`: Load only a specific number of rows from the file.
- `skiprows`: Skip a specified number of rows at the beginning of the file.
- `usecols`: Specify which columns to load by providing a list of column names.
- `dtype`: Pre-define data types for columns to optimize memory usage and prevent data type inference.
- `skip_blank_lines`: Skip empty lines in the file.
- `encoding`: Specify the character encoding of the file.

Here's an example of using some of these options:

```python
import pandas as pd

# Load the first 100 rows of specific columns with predefined data types
data = pd.read_csv('data.csv', nrows=100, usecols=['Name', 'Age'], dtype={'Name': str, 'Age': int})
```

Or a more complex example that I commonly use when I want to quickly explore a potentially large dataset that might slow down my computer if I were to try and load it all (say a CSV file with 50 million rows), here is how I would just oad in a random sample of 1% of the rows from the file:

```python
import pandas as pd

# Load a random sample of 100 rows from a CSV file
data = pd.read_csv('data.csv', header=None, skiprows=lambda i: i > 0 and random.random() > 0.01)
```

In this example, the skiprows parameter is used along with a lambda function to skip rows with a probability of approximately 0.99, effectively loading only around 1% of the rows from the CSV file, versus in the other example we were just taking the first 100 rows which may look different then the last 100 rows. This is why we may want to randomly select across all of the rows, to get a more represenitive view of the what the data may look like. 

Pandas provides a flexible and efficient way to load and manipulate data from CSV files, making it an essential tool for health informatics data analysis.
