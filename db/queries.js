const db = require("./connection");

function allUsers() {
  return db.query(
    `SELECT *
    FROM users;`
  );
}

function queryArticles(topic) {
  return db.query(
    `SELECT *
      FROM articles
      WHERE topic = '${topic}';`
  );
}

function queryComments(votes) {
  return db.query(
    `SELECT *
        FROM comments
        WHERE votes < ${votes};`
  );
}

function queryTopics() {
  return db.query(
    `SELECT *
        FROM topics;`
  );
}

function queryArticlesByUser(user) {
  return db.query(
    `SELECT *
        FROM articles
        WHERE author = '${user}';`
  );
}

function queryCommentsByVotes(votes) {
  return db.query(
    `SELECT *
      FROM comments
      WHERE votes > ${votes};`
  );
}

// allUsers().then((response) => {
//   console.log(response.rows);
// });

// queryArticles("coding").then((response) => {
//   console.log(response.rows);
// db.end();
// });

// queryComments(0).then((response) => {
//   console.log(response.rows);
//   db.end();
// });

// queryTopics().then((response) => {
//   console.log(response.rows);
//   db.end();
// });

// queryArticlesByUser("grumpy19").then((response) => {
//   console.log(response.rows);
//   db.end();
// });

// queryCommentsByVotes(10).then((response) => {
//   console.log(response.rows);
//   db.end();
// });
