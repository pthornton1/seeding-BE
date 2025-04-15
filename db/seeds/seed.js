const db = require("../connection");
const { dropTables, createTables, insertData } = require("./utils");

const seed = ({ topicData, userData, articleData, commentData }) => {
  return dropTables()
    .then(() => {
      return createTables();
    })
    .then(() => {
      return insertData({ topicData, userData, articleData, commentData });
    });
};
module.exports = seed;
