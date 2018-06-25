from flask import Flask
app = Flask(__name__)

@app.route('/linear/simple', methods=['POST'])
def hello_world():
    return 'Hello, World!'
hello_world()