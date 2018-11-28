## Project
Current changes to this API are planned and tracked in the shared project board under [the UI's GitHub Projects](https://github.com/WilliamTOliver/WTO-Portfolio-UI/projects)

## Boilerplate

This projects initial setup and auth was based on:
'Creating a RESTful API with Node.js'
A YouTube series and GitHub repo.
Check it out here:
[Boilerplate API Repository](https://github.com/academind/node-restful-api-tutorial.git)

## Local Development

### Requirements:

- .env This project uses dotenv to manage private info. A quick search through the project for process.env will show the env properties you will need to populate in order to have the project work.

The Python in this project is part of me experimenting with some machine learning course work in an environment I feel comfortale playing around in and is not in an isolated environment; it will likely throw errors until you get all dependancies up to date on your machine. 

To run the server, simply run `npm run start`
The Python services are held within the same repo, under /services. For now, they are accessed via child_process within the python-shell. 

The only current consumer of the Python Scripts in this project is the /build chart endpoint.
