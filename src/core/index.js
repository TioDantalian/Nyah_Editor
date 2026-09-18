const { GeometryEngine, FlowEngine, AlignmentStrategies } = require('./slicer');
const { Hyphenator } = require('./hyphenator');
const { SpatialEngine } = require('./spatial');
const Units = require('./units');
const PdfEngine = require('./pdf');
const Schema = require('./schema');
const Styles = require('./styles');
const DocModel = require('./document');
const Commands = require('./commands');
const { OpenDTPEngine } = require('./engine');

module.exports = {
  // Motores de Processamento
  GeometryEngine,
  Hyphenator,
  FlowEngine,
  AlignmentStrategies,
  SpatialEngine,
  Units,
  PdfEngine,

  // Arquitetura de Documento e Estado
  Schema,
  Styles,
  DocModel,
  Commands,
  OpenDTPEngine
};
