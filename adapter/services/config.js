const responseHelper = require('./helpers/responseHelper');
const fs = require('file-system');

const i18n = {
    en: {
        charts: {
            simpleLinear: {
                title: 'Simple Linear Regression',
                description: 'lala'
            },
            polynomial: {
                title: 'Polynomial Linear Regression',
                description: 'lala'
            },
            decisionTree: {
                title: 'Decision Tree Regression',
                description: 'lala'
            },
            randomForest: {
                title: 'Random Forest Regression',
                description: 'lala'
            },
            svr: {
                title: 'SVR',
                description: 'lala'
            }
        }

    },
    de: {}
}
exports.getConfig = (req, res) => {
fs.writeFile('./i18n.json', JSON.stringify(i18n));


};


