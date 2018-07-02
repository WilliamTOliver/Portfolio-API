const mongoose = require('mongoose');

const chartSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  chart: {
    title: { text: { type: String } },
    tooltip: {
      trigger: { type: String },
      axisPointer: { type: { type: String } }
    },
    type: { type: String },
    series: Array,
    xAxis: { type: { type: String } },
    yAxis: { type: { type: String } }
  },
  description: { type: String },
  type: { type: String }
});

module.exports = mongoose.model('Chart', chartSchema);
