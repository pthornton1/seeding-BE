const db = require("../../db/connection");
const format = require("pg-format");

convertTimestampToDate = ({ created_at, ...otherProperties }) => {
  if (!created_at) return { ...otherProperties };
  return { created_at: new Date(created_at), ...otherProperties };
};

exports.convertTimestampToDate = convertTimestampToDate;

exports.dropTables = () => {
  return db
    .query(`DROP TABLE IF EXISTS comments;`)
    .then(() => {
      return db.query(`DROP TABLE IF EXISTS articles;`);
    })
    .then(() => {
      return db.query(`DROP TABLE IF EXISTS topics;`);
    })
    .then(() => {
      return db.query(`DROP TABLE IF EXISTS users;`);
    });
};

exports.createTables = () => {
  return db
    .query(
      `CREATE TABLE topics (
          slug VARCHAR(100) PRIMARY KEY,
          description VARCHAR(500) NOT NULL, 
          img_url VARCHAR(1000) NOT NULL);`
    )
    .then(() => {
      return db.query(
        `CREATE TABLE users (
          username VARCHAR(200) PRIMARY KEY,
          name VARCHAR(200) NOT NULL, 
          avatar_url VARCHAR(1000) NOT NULL
        );`
      );
    })
    .then(() => {
      return db.query(
        `CREATE TABLE articles (
        article_id SERIAL PRIMARY KEY,
        title VARCHAR(100) NOT NULL,
        topic VARCHAR(100) REFERENCES topics(slug),
        author VARCHAR(200) REFERENCES users(username),
        body TEXT NOT NULL,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        votes INT DEFAULT 0,
        article_img_url VARCHAR(1000));`
      );
    })
    .then(() => {
      return db.query(
        `CREATE TABLE comments (
        comment_id SERIAL PRIMARY KEY,
        article_id INT REFERENCES articles(article_id),
        body TEXT,
        votes INT DEFAULT 0,
        author VARCHAR(100) REFERENCES users(username),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`
      );
    });
};

exports.insertData = ({ topicData, userData, articleData, commentData }) => {
  const topicInsertArr = topicData.map((topic) => {
    return [...Object.values(topic)];
  });
  const topicInsertQuery = format(
    `INSERT INTO topics (description, slug, img_url) VALUES %L;`,
    topicInsertArr
  );
  return db
    .query(topicInsertQuery)
    .then(() => {
      const userInsertArr = userData.map((user) => {
        return [...Object.values(user)];
      });
      const userInsertQuery = format(
        `INSERT INTO users (username, name, avatar_url) VALUES %L;`,
        userInsertArr
      );
      return db.query(userInsertQuery);
    })
    .then(() => {
      const articleInsertArr = articleData.map((article) => {
        const updatedArticle = convertTimestampToDate(article);
        return [
          updatedArticle.title,
          updatedArticle.topic,
          updatedArticle.author,
          updatedArticle.body,
          updatedArticle.created_at,
          updatedArticle.votes,
          updatedArticle.article_img_url,
        ];
      });

      const articleInsertQuery = format(
        `INSERT INTO articles 
        (title, topic, author, body, created_at, votes, article_img_url)
         VALUES %L
         RETURNING *;`,
        articleInsertArr
      );
      return db.query(articleInsertQuery);
    })
    .then((result) => {
      console.log(result.rows.slice(0, 2));
      const referenceObj = createRef(result.rows);
      const commentInsertArr = commentData.map((comment) => {
        const updatedComment = convertTimestampToDate(comment);
        updatedComment.article_id = referenceObj[updatedComment.article_title];
        return [
          updatedComment.article_id,
          updatedComment.body,
          updatedComment.votes,
          updatedComment.author,
          updatedComment.created_at,
        ];
      });
      const commentInsertQuery = format(
        `INSERT INTO comments (article_id, body, votes, author, created_at) VALUES %L;`,
        commentInsertArr
      );
      return db.query(commentInsertQuery);
    });
};

function createRef(articleRowsArr) {
  refObj = {};
  articleRowsArr.forEach((row) => {
    refObj[row.title] = row.article_id;
  });
  return refObj;
}

exports.createRef = createRef;
