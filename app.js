const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbpath = path.join(__dirname, "moviesData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const getMoviesList = (moviesData) => {
  return {
    movieName: moviesData.movie_name,
  };
};

//get all movie names list
app.get("/movies/", async (request, response) => {
  const getMovieNames = `
    SELECT
    *
    FROM
    movie;`;
  const movieNameList = await db.all(getMovieNames);
  response.send(movieNameList.map((moviesData) => getMoviesList(moviesData)));
});

//creates new movie in the table
app.post("/movies/", async (request, response) => {
  const moviesDetails = request.body;
  const { directorId, movieName, leadActor } = moviesDetails;
  const addMovieQuery = `
    INSERT INTO
    movie(
        director_id,
        movie_name,
        lead_actor)
    VALUES(
        ${directorId},
        '${movieName}',
        '${leadActor}');`;
  const dbResponse = db.run(addMovieQuery);
  response.send("Movie Successfully Added");
});

const getOnlyMovie = (movie) => {
  return {
    movieId: movie.movie_id,
    directorId: movie.director_id,
    movieName: movie.movie_name,
    leadActor: movie.lead_actor,
  };
};

//get movie name
app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovieQuery = `
    SELECT
    *
    FROM 
    movie
    WHERE
    movie_id = ${movieId};`;
  const movieArray = await db.get(getMovieQuery);
  response.send(movieArray.map((movie) => getOnlyMovie(movie)));
});

//updates the details of the movie
app.put("/movies/:movieId", async (request, response) => {
  const { movieId } = request.params;
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const updateMovieQuery = `
    UPDATE
    movie
    SET
    director_id = ${directorId},
    movie_name = '${movieName}',
    lead_actor = '${leadActor}'
    WHERE
    movie_id = ${movieId};`;
  await db.run(updateMovieQuery);
  response.send("Movie Details Updated");
});

//deletes movie from the movie table
app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovieQuery = `
    DELETE FROM movie
    WHERE
    movie_id = ${movieId};`;
  await db.run(deleteMovieQuery);
  response.send("Movie Removed");
});

const directorsList = (dbObject) => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  };
};

//get directors list
app.get("/directors/", async (request, response) => {
  const getDirectorsQuery = `
    SELECT 
    *
    FROM
    director;`;
  const directorsArray = await db.all(getDirectorsQuery);
  response.send(directorsArray.map((director) => directorsList(director)));
});

const moviesList = (dbObject) => {
  return {
    movieName: dbObject.movie_name,
  };
};

//get movies list directed by specific director
app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getDirectorMovies = `
    SELECT
    *
    FROM
    movie
    WHERE director_id = ${directorId};`;
  const moviesArray = await db.all(getDirectorMovies);
  response.send(moviesArray.map((movie) => moviesList(movie)));
});
module.exports = app;
