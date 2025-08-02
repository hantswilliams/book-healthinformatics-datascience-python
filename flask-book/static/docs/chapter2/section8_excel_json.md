### Loading Excel Files
Excel files (.xlsx) are widely used for data storage. Pandas offers the `read_excel()` function to load Excel files:

```python
# Load an Excel file
data = pd.read_excel('data.xlsx')
```

### Loading JSON Files
JSON (JavaScript Object Notation) files are used for structured data interchange. Use `read_json()` to load JSON files:
```python
# Load a JSON file
data = pd.read_json('data.json')
```

#### Complex Example
Now, the JSON files will not also be clean, or may not always have a simple format that can be automatically parsed by the `read_json()` function with pandas. Lets take the below example, where we have some data coming from healthdata.gov, where their JSON files not only contain the data, but also a ton of meta data. 

The data origin is from the state of NY, and the data relates to [cardiac surgery and PCI by hospital](https://health.data.ny.gov/Health/Cardiac-Surgery-and-PCI-by-Hospital-Beginning-2011/2wey-wrtg). 

Lets take the data that we can find here from health.data.ny.gov, which looks like this:

```json
{
  "meta" : {
    "view" : {
      "id" : "2wey-wrtg",
      "name" : "Cardiac Surgery and PCI by Hospital: Beginning 2011",
      "assetType" : "chart",
      "attribution" : "New York State Department of Health",
      "attributionLink" : "http://www.health.ny.gov/health_care/consumer_information/cardiac_surgery/",
      "averageRating" : 0,
      "category" : "Health",
      "createdAt" : 1370594195,
      "description" : "This column chart presents the number of cardiac procedures performed by hospital.  It is important to note that Emergency PCI and Valve Surgery are reported only in 3-year increments.  Comparing procedures reported in 3-year increments to those reported in single year increments (e.g. CABG to Valve or Non-Emergency PCI to Emergency PCI) may lead to incorrect conclusions concerning procedural volume.\r\n\r\nFor more information check out:http://www.health.ny.gov/health_care/consumer_information/cardiac_surgery/.",
      "displayType" : "chart",
      "downloadCount" : 3435,
      "hideFromCatalog" : false,
      "hideFromDataJson" : false,
      "indexUpdatedAt" : 1561662734,
      "licenseId" : "PUBLIC_DOMAIN",
      "modifyingViewUid" : "jtip-2ccj",
      "newBackend" : true,
      "numberOfComments" : 0,
      "oid" : 28662755,
      "provenance" : "official",
      "publicationAppendEnabled" : false,
      "publicationDate" : 1499964309,
      "publicationGroup" : 868744,
      "publicationStage" : "published",
      "rowClass" : "",
      "rowsUpdatedAt" : 1685715512,
      "rowsUpdatedBy" : "a9xd-f5um",
      "tableId" : 15126304,
      "totalTimesRated" : 0,
      "viewCount" : 63499,
      "viewLastModified" : 1561662717,
      "viewType" : "tabular",
    }
  },
"data" : [ [ "row-598j-tsvy~cxmi", "00000000-0000-0000-F633-46B87DD60001", 0, 1426023384, null, 1426023384, null, "{ }", "1438", "Bellevue Hospital Ctr", "Manhattan", "NY Metro - NYC", "All PCI", "2011", "479", "10", "2.09", "1.21", "1.68", "0.80", "3.08", "Rate not different than Statewide Rate" ]
, [ "row-qfk3_mv8t.sc5f", "00000000-0000-0000-1CED-2AAB0D36C737", 0, 1426023384, null, 1426023384, null, "{ }", "1439", "Beth Israel Med Ctr", "Manhattan", "NY Metro - NYC", "All PCI", "2011", "1538", "13", "0.85", "0.78", "1.06", "0.56", "1.81", "Rate not different than Statewide Rate" ]
, [ "row-sat8.33jx-5jhx", "00000000-0000-0000-A48F-FDC7EA52547C", 0, 1426023384, null, 1426023384, null, "{ }", "1178", "Bronx-Lebanon-Cncourse", "Bronx", "NY Metro - NYC", "All PCI", "2011", "67", "2", "2.99", "1.48", "1.96", "0.22", "7.08", "Rate not different than Statewide Rate" ]
, [ "row-vb6t_aw9x.mdh8", "00000000-0000-0000-8F40-97AC444663CB", 0, 1426023384, null, 1426023384, null, "{ }", "1286", "Brookdale Hosp Med Ctr", "Kings", "NY Metro - NYC", "All PCI", "2011", "209", "3", "1.44", "1.35", "1.03", "0.21", "3.02", "Rate not different than Statewide Rate" ]
, [ "row-ucjk_79si~w6ci", "00000000-0000-0000-4822-1A4A2609880B", 0, 1426023384, null, 1426023384, null, "{ }", "1626", "Elmhurst Hospital Ctr", "Queens", "NY Metro - NYC", "All PCI", "2011", "448", "4", "0.89", "1.09", "0.79", "0.21", "2.04", "Rate not different than Statewide Rate" ]
, [ "row-tjin_7emu_m3dn", "00000000-0000-0000-8E12-BC2E5BD26AC7", 0, 1426023384, null, 1426023384, null, "{ }", "1005", "Glens Falls Hospital", "Capital District", "Capital District", "All PCI", "2011", "231", "1", "0.43", "0.68", "0.62", "0.01", "3.44", "Rate not different than Statewide Rate" ]
, [ "row-483k~6rxy-vwyb", "00000000-0000-0000-3FB1-39D5E6DCC2B6", 0, 1426023384, null, 1426023384, null, "{ }", "1629", "Jamaica Hosp Med Ctr", "Queens", "NY Metro - NYC", "All PCI", "2011", "220", "11", "5.00", "1.71", "2.84", "1.42", "5.08", "Rate significantly higher than Statewide Rate" ]
]
}
```

In this abbreviated part of the full json file, we can see that there is a `meta` section, which contains a bunch of meta data related to the dataset, while we also have a `data` section, which is where the actual data lives. 

So in order to parse and load this correctly into a dataframe, we first need to load the data, which we can use with a built in python package called `requests` which allows us to directly pull text from a website, and then use another built in python pacakge called json and the command `.json()` to then tell python that the data we are loading from requests is of the JSON type. This then converts the JSON into a dictionary. 

Finally, and then using our ` [ ] ` brackets for this converted JSON dictionary in python, and can keep only the `data` key and its value(s) - e.g., the raw data, and load that into a pandas df. 

```python
import json
import pandas as pd 
import requests

## Data URL 
data_url = 'https://health.data.ny.gov/api/views/2wey-wrtg/rows.json'

## Only keeping the part of the JSON that we require: the 'data' key 
json = requests.get(data_url).json()['data']

## Now we can convert it to a dataframe
df = pd.DataFrame(json)
```
