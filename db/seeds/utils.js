const db = require("../../db/connection");
const format = require("pg-format");

exports.convertTimestampToDate = ({ created_at, ...otherProperties }) => {
  if (!created_at) return { ...otherProperties };
  return { created_at: new Date(created_at), ...otherProperties };
};

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
        article.created_at = new Date(article.created_at).toISOString();
        return [...Object.values(article)];
      });

      const articleInsertQuery = format(
        `INSERT INTO articles (title, topic, author, body, created_at, votes, article_img_url) VALUES %L;`,
        articleInsertArr
      );
      return db.query(articleInsertQuery);
    })
    .then(() => {
      return insertComments(commentData);
    });
};

function insertComments(commentData) {
  const commentDataCopy = [...commentData];
  const promiseArr = [];
  commentDataCopy.forEach((comment) => {
    const articleIdQuery = format(
      `SELECT title, article_id 
        FROM articles 
        WHERE title = %L;`,
      [comment.article_title]
    );
    promiseArr.push(db.query(articleIdQuery));
  });
  return Promise.all(promiseArr).then((responses) => {
    const commentInsertArr = commentDataCopy.map((comment) => {
      const commentCopy = { ...comment };
      const article_id = responses.find((response) => {
        return (response.rows[0].title = commentCopy.article_title);
      }).rows[0].article_id;
      commentCopy.article_id = article_id;
      commentCopy.created_at = new Date(commentCopy.created_at).toISOString();
      return [
        commentCopy.article_id,
        commentCopy.body,
        commentCopy.votes,
        commentCopy.author,
        commentCopy.created_at,
      ];
    });
    const commentInsertQuery = format(
      `INSERT INTO comments (article_id, body, votes, author, created_at) VALUES %L;`,
      commentInsertArr
    );
    return db.query(commentInsertQuery);
  });
}
