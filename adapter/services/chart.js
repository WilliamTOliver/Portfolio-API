const responseHelper = require('./helpers/responseHelper');
const machineLearningService = require('./machineLearning');

exports.getChartSummaries = (req, res) => {
};

exports.getChartDetails = (req, res) => {
};

exports.buildCharts = (req, res) => {
    machineLearningService.buildCharts().then((status) => {
        responseHelper.success(res, status);
    }).catch((err) => {
        responseHelper.error(res, err.status, err.message);
    });
}

