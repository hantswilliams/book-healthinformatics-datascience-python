from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

## chapter 1
@app.route('/chapter1')
def chapter1():
    return render_template('chapter1/page1.html')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5002)