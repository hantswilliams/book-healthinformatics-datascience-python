# how to start / creat a new book-project with quarto

## create a new book project
- install the quarto extension to vscode
- create a new folder for your book project
- open the folder in vscode

## main commands to remember

### running 

`quarto preview` will open the browser with the rendered html file.

### adding live code:
`quarto add r-wasm/quarto-live` will add the live code feature to the markdown file.

- then can change _quarto.yaml to:
```yaml
format:
  live-html:
```

### publishing 
- github pages:
    - `quarto publish gh-pages` will publish the html file to the gh-pages branch