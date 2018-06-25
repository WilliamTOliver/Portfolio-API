const responseHelper = require('./helpers/responseHelper');
const machineLearningService = require('./machineLearning');

exports.getChartSummaries = (req, res) => {
};

exports.getChartDetails = (req, res) => {
};

exports.buildCharts = (req, res) => {
    machineLearningService.buildCharts().then((status) => {
        console.log(status)
        responseHelper.success(res, 200);
    }).catch((err) => {
        responseHelper.error(res, 500, err);
    });
}

