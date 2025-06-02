// Function to fetch movie details from TMDb API
async function fetchMovieDetails(titles) {
  const TMDB_API_KEY = "5cff2d0924eeb3f6d5090d0471d4ce18";
  const TMDB_BASE_URL = "https://api.themoviedb.org/3";

  const movieDetailsList = [];

  for (const title of titles) {
    try {
      // Search for the movie by title
      const searchResponse = await fetch(
        `${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(
          title
        )}&api_key=${TMDB_API_KEY}`
      );

      if (!searchResponse.ok) {
        console.error(
          "Failed TMDb search request:",
          await searchResponse.json()
        );
        continue;
      }

      const searchData = await searchResponse.json();
      if (searchData.results && searchData.results.length > 0) {
        const movie = searchData.results[0];

        movieDetailsList.push({
          title: movie.title,
          poster: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
          rating: Math.round(movie.vote_average * 10) / 10,
          releaseDate: movie.release_date,
          overview: movie.overview,
          url: `https://www.themoviedb.org/movie/${movie.id}`,
        });
      }
    } catch (error) {
      console.error("Error fetching movie details:", error);
    }
  }

  // Display movie details in a slider
  displayMovieSlider(movieDetailsList);
}

// Function to prompt the AI with the user's query
async function promptAI(query) {
  const KEY = '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'
  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${KEY}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "You are a helpful assistant for guessing the title of a movie based on a description. " +
                "You will be provided with a description of a movie, and you should respond with three possible titles. " +
                "ONLY respond with the titles, one per line, without any additional text or explanations. ",
            },
            {
              role: "user",
              content: query,
            },
          ],
          model: "llama-3.3-70b-versatile",
          temperature: 1,
          max_tokens: 1024,
          top_p: 1,
          stream: false,
          stop: null,
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.choices && data.choices[0]) {
        const movieTitles = data.choices[0].message.content
          .split("\n")
          .map((title) => title.trim())
          .filter((title) => title);

        console.log("AI response:", movieTitles);

        // Fetch movie details from TMDb
        await fetchMovieDetails(movieTitles);
      } else {
        console.error("Unexpected AI response:", data);
      }
    } else {
      console.error("Failed AI request:", await response.json());
    }
  } catch (error) {
    console.error("Error contacting AI:", error);
  }
}

// Function to display movie details in a slider
function displayMovieSlider(movieDetailsList) {
  // Remove the existing search input if it exists
  const existingInput = document.querySelector(".search-input");
  if (existingInput) {
    existingInput.remove();
  }

  // First animate the container back to a circle, and then back to a square
  transformContainerShape();

  // Remove the search logo icon as we do not need it anymore
  const searchContainer = document.querySelector(".start-search-box");

  // Hide the search box
  searchContainer.style.display = "none";

  // Wait 1 second before displaying the movie details
  setTimeout(() => {
    // Revert the container to a square shape
    transformContainerShape();
  }, 1000);

  setTimeout(() => {
    let currentIndex = 0;

    const container = document.querySelector(".container");
    container.innerHTML = "";

    // Function to update the displayed movie
    const updateMovieDisplay = () => {
      const movie = movieDetailsList[currentIndex];

      container.innerHTML = `
      <div class="movie-display">
        <h2><span>Here's what I found</span></h2>
        <img src="${movie.poster}" alt="${
        movie.title
      } Poster" onclick="window.open('${movie.url}', '_blank')">
        <h3>${movie.title}</h3>
        <p><strong>Rating:</strong> ${movie.rating}</p>
        <p><strong>Release Date:</strong> ${movie.releaseDate}</p>
        <p>${movie.overview}</p>
      </div>
      <div class="slider-controls">
        ${
          currentIndex > 0
            ? '<button class="arrow left-arrow">&larr;</button>'
            : ""
        }
        ${
          currentIndex < movieDetailsList.length - 1
            ? '<button class="arrow right-arrow">&rarr;</button>'
            : ""
        }
      </div>
    `;

      // Add event listeners to the arrows
      const leftArrow = container.querySelector(".left-arrow");
      const rightArrow = container.querySelector(".right-arrow");

      if (leftArrow) {
        leftArrow.addEventListener("click", () => {
          currentIndex--;
          updateMovieDisplay();
        });
      }

      if (rightArrow) {
        rightArrow.addEventListener("click", () => {
          currentIndex++;
          updateMovieDisplay();
        });
      }
    };

    // Initialize the display
    updateMovieDisplay();
  }, (timeout = 1500));
}

// Function to transform the container into a circle or square
function transformContainerShape() {
  document.querySelector(".container").classList.toggle("square");
}

// Function to hide the search logo and display the search input
function showInputBox() {
  const container = document.querySelector(".container");
  const searchContainer = document.querySelector(".start-search-box");

  // Hide the search box
  searchContainer.style.display = "none";

  // Transition the container from a circle to a square
  transformContainerShape();

  // Create a new input element to append to the container
  const input = document.createElement("textarea");
  input.type = "text";
  input.placeholder =
    "e.g., a movie about a man bitten by a radioactive spider who fights crime.";
  input.className = "search-input";

  // Append the input to the container
  container.appendChild(input);

  // Add an event listener to the input to handle Enter key press
  input.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault(); // Prevent the default action of the Enter key
      const query = input.value.trim();
      if (query) {
        // Prompt the AI with the user's query
        promptAI(query);
      }
    }
  });
}
