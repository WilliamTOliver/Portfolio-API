## Project
Current changes to this API are planned and tracked in the shared project board under [the UI's GitHub Projects](https://github.com/WilliamTOliver/WTO-Portfolio-UI/projects)

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
  }`
  The Python in this project is not in an isolated environment and will likely throw errors until you get all dependancies up to date on your machine. I may add documentation to help this process, but that is after I decide whether to extract the python to a service and deploy it as a seperate Flask/other external project to be consumed as any other external API.

The Node portion of this repo acts as an adapter layer to python services for an Angular UI.
To run the server, simply run `npm run start`
The Python services are held within the same repo, under /services. For now, they are accessed via child_process within the python-shell. This may change and the python may be extracted into a seperate project in the future.
