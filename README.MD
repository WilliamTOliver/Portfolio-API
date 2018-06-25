## Boilerplate

This projects initial setup was based on:
'Creating a RESTful API with Node.js'
A YouTube series and GitHub repo.
Check it out here:
[Boilerplate API Repository](https://github.com/academind/node-restful-api-tutorial.git)

## Local Development

### Requirements:

- config.json
  At root level, create a config.json file and enter values matching the content below.
  `{
  "connection": {
  "location": "[YOURMLAB].mlab.com:[YOURMLABPORT]/[YOURCOLLECTION]",
  "defaultUser": {
  "username": "[YOUR USER]",
  "password": "[YOUR USER'S PASS]"
  }
  },
  "serviceEndpoints": {
  "root": "http://[YOURIP/LocalHost]:5000/",
  "linear": {
  "simple": "linear/simple",
  "multi": "linear/multi"
  }
  }
  }`
  Make sure you have Python 3.4 or newer installed on your machine.

The Node portion of this repo acts as an adapter layer to python services for an Angular UI.
To run the server, simply run `npm run start`
The Python services are held within the same repo, under /services.
To run the services, cd into `services` and run `export FLASK_APP=main.py` and `flask run`
