const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Set the view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Fetch random cocktail data and render the storytelling template
app.get('/', async (req, res) => {
    try {
        const response = await axios.get('https://www.thecocktaildb.com/api/json/v1/1/random.php');
        const drink = response.data.drinks[0];

        // Process ingredients and measures into an array
        const ingredients = [];
        for (let i = 1; i <= 15; i++) {
            const ingredient = drink[`strIngredient${i}`];
            const measure = drink[`strMeasure${i}`];
            if (ingredient) {
                ingredients.push({
                    name: ingredient,
                    measure: measure ? measure.trim() : ''
                });
            }
        }

        res.render('index', { drink, ingredients, error: null });
    } catch (error) {
        console.error('Error fetching cocktail data:', error.message);
        res.render('index', { drink: null, ingredients: null, error: 'Failed to fetch the cocktail tale. Please try again later.' });
    }
});

// Fetch categorized menu items
app.get('/menu', async (req, res) => {
    try {
        // Fetch 4 distinct categories
        const endpoints = [
            'https://www.thecocktaildb.com/api/json/v1/1/filter.php?c=Cocktail',
            'https://www.thecocktaildb.com/api/json/v1/1/filter.php?c=Ordinary_Drink',
            'https://www.thecocktaildb.com/api/json/v1/1/filter.php?c=Shot',
            'https://www.thecocktaildb.com/api/json/v1/1/filter.php?a=Non_Alcoholic'
        ];

        const [cocktails, ordinary, shots, nonAlcoholic] = await Promise.all(
            endpoints.map(endpoint => axios.get(endpoint))
        );

        // Helper to get 5-10 random items from a category
        const getRandomItems = (list, count) => {
            const shuffled = [...list].sort(() => 0.5 - Math.random());
            return shuffled.slice(0, count);
        };

        const menuData = {
            "CLASSIC": getRandomItems(ordinary.data.drinks, 3),
            "SIGNATURE CREATIONS": getRandomItems(cocktails.data.drinks, 3),
            "NON-ALCOHOLIC OPTIONS": getRandomItems(nonAlcoholic.data.drinks, 3),
            "ON THE ROCKS": getRandomItems(shots.data.drinks, 3)
        };

        res.render('menu', { menuData, error: null });
    } catch (error) {
        console.error('Error fetching menu data:', error.message);
        res.render('menu', { menuData: null, error: 'Failed to retrieve the drink menu. Please try again later.' });
    }
});

// Start the server
const server = app.listen(PORT, () => {
    console.log(`Cocktails storytelling server running at http://localhost:${PORT}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`Port ${PORT} is in use, trying an alternative port...`);
        setTimeout(() => {
            const alternativePort = PORT + 1;
            server.listen(alternativePort);
        }, 1000);
    } else {
        console.error('Server error:', err);
    }
});
