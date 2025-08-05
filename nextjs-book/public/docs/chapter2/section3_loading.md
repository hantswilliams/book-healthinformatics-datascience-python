## Loading in Data with Pandas

Pandas excels not only in data manipulation but also in data loading. It provides a variety of methods to load data from various file formats and data sources. Let's explore some common file formats and how to load them using pandas.

For a thorough review of how to load in pandas, please review the documentation, specifically the input and output section (i/o) found [here](https://pandas.pydata.org/docs/reference/io.html). To emphasize the volume and variety of of reading different file types, here are the options that we have: 

```python
pandas.read_pickle
pandas.DataFrame.to_pickle
pandas.read_table
pandas.read_csv
pandas.DataFrame.to_csv
pandas.read_fwf
pandas.read_clipboard
pandas.DataFrame.to_clipboard
pandas.read_excel
pandas.DataFrame.to_excel
pandas.ExcelFile
pandas.ExcelFile.book
pandas.ExcelFile.sheet_names
pandas.ExcelFile.parse
pandas.io.formats.style.Styler.to_excel
pandas.ExcelWriter
pandas.read_json
pandas.json_normalize
pandas.DataFrame.to_json
pandas.io.json.build_table_schema
pandas.read_html
pandas.DataFrame.to_html
pandas.io.formats.style.Styler.to_html
pandas.read_xml
pandas.DataFrame.to_xml
pandas.DataFrame.to_latex
pandas.io.formats.style.Styler.to_latex
pandas.read_hdf
pandas.HDFStore.put
pandas.HDFStore.append
pandas.HDFStore.get
pandas.HDFStore.select
pandas.HDFStore.info
pandas.HDFStore.keys
pandas.HDFStore.groups
pandas.HDFStore.walk
pandas.read_feather
pandas.DataFrame.to_feather
pandas.read_parquet
pandas.DataFrame.to_parquet
pandas.read_orc
pandas.DataFrame.to_orc
pandas.read_sas
pandas.read_spss
pandas.read_sql_table
pandas.read_sql_query
pandas.read_sql
pandas.DataFrame.to_sql
pandas.read_gbq
pandas.read_stata
pandas.DataFrame.to_stata
pandas.io.stata.StataReader.data_label
pandas.io.stata.StataReader.value_labels
pandas.io.stata.StataReader.variable_labels
pandas.io.stata.StataWriter.write_file
```

## `pandas` versus `pd` ?
When you are looking at the official documentation and code examples, you may see that those examples spell out the pandas package fully `pandas.reads_sql()` as an example. 

But when we use `import pandas as pd`, we would then call the pandas functions such as `read_sql` by using `pd.read_sql` which is the equivalent to `pandas.read_sql()`. 

This is a great example of how customizable the code can be and its flexibility, but how it can also lead to confusion. So if you use `import pandas as pd`, be sure to use `pd`, versus if you just use `import pandas`, then just use `pandas` when calling pandas functions related to loading in a dataset or database.
