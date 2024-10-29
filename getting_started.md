# how to start / creat a new book-project with quarto

## create a new book project
- install the quarto extension to vscode
- create a new folder for your book project
- open the folder in vscode

## main commands to remember

### running 

`quarto preview` will open the browser with the rendered html file.

### adding live code:
`quarto add r-wasm/quarto-live` will add the live code feature to the markdown file. This should be performed in the 'book' folder of the project.

- then can change _quarto.yaml to:
```yaml
format:
  live-html:
```

### publishing 
- github pages:
    - first time, will need to install (at min.):
        `quarto install tinytex`
        - this will install the tinytex package for latex
    - `quarto publish gh-pages` will publish the html file to the gh-pages branch - from the 'book' folder of the project.
        - this afterwords, should then give a link to the published book.
        - should look like:
            ```bash
            [✓] Published to https://hantswilliams.github.io/book-healthinformatics-datascience-python/
            ```