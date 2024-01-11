// Get canvas and 2D rendering context
const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

// Get score element
const scoreEl = document.getElementById('scoreEl')

// Set initial dimensions of the canvas to match the viewport
canvas.width = innerWidth 
canvas.height = innerHeight 

// Class for creating boundaries (walls)
class Walls {
    static width = 40
    static height = 40
    constructor({ position }){
        this.position = position
        this.width = 40
        this.height = 40
    }
    
    draw() {
        // Draw a filled blue square representing a boundary
        c.fillStyle = 'blue'
        c.fillRect(this.position.x, this.position.y, this.width, this.height)
    }
}

// Class for creating the player character
class Player {
    constructor({ position, velocity }) {
        this.position = position
        this.velocity = velocity
        this.radius = 15
    }

    draw() {
        // Draw a filled yellow circle representing the player
        c.beginPath()
        c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI *2)
        c.fillStyle = 'yellow'
        c.fill()
        c.closePath()
    }

    update() {
        // Update player position and redraw
        this.draw()
        this.position.x += this.velocity.x
        this.position.y += this.velocity.y
    }
}

// Class for creating ghost enemies
class Ghost {
    static speed = 2
    constructor({ position, velocity, color = 'red' }) {
        this.position = position
        this.velocity = velocity
        this.radius = 15
        this.color = color
        this.prevCollisions = []
        this.speed = 2
    }

    draw() {
        // Draw a filled circle representing a ghost
        c.beginPath()
        c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI *2)
        c.fillStyle = this.color
        c.fill()
        c.closePath()
    }

    update() {
        // Update ghost position and redraw
        this.draw()
        this.position.x += this.velocity.x
        this.position.y += this.velocity.y
    }
}

// Class for creating pellets (collectibles)
class Pellet {
    constructor({ position }) {
        this.position = position
        this.radius = 3
    }

    draw() {
        // Draw a filled white circle representing a pellet
        c.beginPath()
        c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI *2)
        c.fillStyle = 'white'
        c.fill()
        c.closePath()
    }
}

// Arrays to store pellets, boundaries, and ghosts
const pellets = []
const boundaries = []
const ghosts = [
    new Ghost({
        position: {
            x: Walls.width * 6 + Walls.width /2,
            y: Walls.height + Walls.height /2
        },
        velocity: {
            x: Ghost.speed,
            y: 0
        }
    })
]
const player = new Player({
    position: {
        x: Walls.width + Walls.width /2,
        y: Walls.height + Walls.height /2
    },
    velocity: {
        x: 0,
        y: 0
    }
})

// Object to track pressed keys
const keys = {
    w: {
        pressed: false
    },
    a: {
        pressed: false
    },
    s: {
        pressed: false
    },
    d: {
        pressed: false
    }
}

let lastKey = ''; // Variable to store the last pressed key
let score = 0; // Player's score

// Map representing the game layout
const map = [
    ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'],
    ['-', '.', '.', '.', '.', '.', '.', '.', '.', '.', '-'],
    ['-', '.', '-', '.', '-', '-', '-', '.', '-', '.', '-'],
    ['-', '.', '.', '.', '.', '-', '.', '.', '.', '.', '-'],
    ['-', '.', '-', '-', '.', '.', '.', '-', '-', '.', '-'],
    ['-', '.', '.', '.', '.', '-', '.', '.', '.', '.', '-'],
    ['-', '.', '-', '.', '-', '-', '-', '.', '-', '.', '-'],
    ['-', '.', '.', '.', '.', '-', '.', '.', '.', '.', '-'],
    ['-', '.', '-', '-', '.', '.', '.', '-', '-', '.', '-'],
    ['-', '.', '.', '.', '.', '-', '.', '.', '.', '.', '-'],
    ['-', '.', '-', '.', '-', '-', '-', '.', '-', '.', '-'],
    ['-', '.', '.', '.', '.', '-', '.', '.', '.', '.', '-'],
    ['-', '.', '-', '-', '.', '.', '.', '-', '-', '.', '-'],
    ['-', '.', '.', '.', '.', '-', '.', '.', '.', '.', '-'],
    ['-', '.', '-', '.', '-', '-', '-', '.', '-', '.', '-'],
    ['-', '.', '.', '.', '.', '-', '.', '.', '.', '.', '-'],
    ['-', '.', '-', '-', '.', '.', '.', '-', '-', '.', '-'],
    ['-', '.', '.', '.', '.', '-', '.', '.', '.', '.', '-'],
    ['-', '.', '-', '.', '-', '-', '-', '.', '-', '.', '-'],
    ['-', '.', '.', '.', '.', '.', '.', '.', '.', '.', '-'],
    ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'],
]

// Populate boundaries and pellets based on the map
map.forEach((row, i) => {
   row.forEach((symbol, j) => {
    switch (symbol) {
        case '-':
            boundaries.push(
                new Walls ({
                    position: {
                        x: Walls.width * j,
                        y: Walls.height * i
                    }
                })
            )
            break
            case '.':
            pellets.push(
                new Pellet({
                    position: {
                        x: j * Walls.width + Walls.width / 2,
                        y: i * Walls.height + Walls.height /2
                    }
                })
            )
            break
    }
   }) 
})

// Function to check collision between a circle(player) and a square(boundary)
function circleCollidesWithSquare({
    circle,
    square
}) 
    {
    const padding = Walls.width /2 - circle.radius - 1
    return(circle.position.y - circle.radius + circle.velocity.y <= square.position.y + square.height + padding &&
        circle.position.x + circle.radius + circle.velocity.x >= square.position.x - padding &&
        circle.position.y + circle.radius + circle.velocity.y >= square.position.y - padding &&
        circle.position.x - circle.radius + circle.velocity.x <= square.position.x + square.width + padding)
}

let animationId // Variable to store animation frame ID

// Main animation loop
function animate() {
    animationId = requestAnimationFrame(animate)

    // Clear the canvas
    c.clearRect(0, 0, canvas.width, canvas.height)

    // Handle player movement based on pressed keys
    if (keys.w.pressed && lastKey === 'w') {
        // Check for collisions with boundaries and adjust player velocity
        // Break the loop if collision occurs
        // Otherwise, set the player velocity for upward movement
        for(let i = 0; i < boundaries.length; i++){
            const boundary = boundaries[i]
            if(
                circleCollidesWithSquare({
                    circle: {
                    ...player,
                    velocity: {
                        x: 0,
                        y: -5
                    }
                },
                square: boundary
            })
        ) {
            player.velocity.y = 0
            break
        } else {
            player.velocity.y = -5
        }
    }
    }
    else if (keys.a.pressed && lastKey === 'a') {
        for(let i = 0; i < boundaries.length; i++){
            const boundary = boundaries[i]
            if(
                circleCollidesWithSquare({
                    circle: {
                    ...player,
                    velocity: {
                        x: -5,
                        y: 0
                    }
                },
                square: boundary
            })
        ) {
            player.velocity.x = 0
            break
        } else {
            player.velocity.x = -5
        }
    }
    }
    else if (keys.s.pressed && lastKey === 's') {
        for(let i = 0; i < boundaries.length; i++){
            const boundary = boundaries[i]
            if(
                circleCollidesWithSquare({
                    circle: {
                    ...player,
                    velocity: {
                        x: 0,
                        y: 5
                    }
                },
                square: boundary
            })
        ) {
            player.velocity.y = 0
            break
        } else {
            player.velocity.y = 5
        }
    }
    }
    else if (keys.d.pressed && lastKey === 'd') {
        for(let i = 0; i < boundaries.length; i++){
            const boundary = boundaries[i]
            if(
                circleCollidesWithSquare({
                    circle: {
                    ...player,
                    velocity: {
                        x: 5,
                        y: 0
                    }
                },
                square: boundary
            })
        ) {
            player.velocity.x = 0
            break
            } else {
                player.velocity.x = 5
            }
        }
    }

    // Repeat the same logic for other movement directions (left, down, right)
    // Adjusting player velocity based on key presses and collisions with boundaries

    // Handle pellet collection and update score
    for(let i = pellets.length - 1; 0 < i; i--) {
        const pellet = pellets[i]
        pellet.draw()

        // Check for collision between player and pellets
        // Remove the pellet and update the score if a collision occurs
        if(Math.hypot(
            pellet.position.x - player.position.x, 
            pellet.position.y - player.position.y
            ) < 
            pellet.radius + player.radius
        ){
            pellets.splice(i, 1)
            score += 10
            scoreEl.innerHTML = score
        }
    }

    // Draw and update boundaries
    boundaries.forEach((boundary) => {
        boundary.draw()

        // Check for collision between player and boundaries
        // Stop player movement if a collision occurs
        if (
            circleCollidesWithSquare({
                circle: player,
                square: boundary
            })
        )   {
            player.velocity.x = 0
            player.velocity.y = 0
        }
    });

    // Draw and update player
    player.update()
    
    // Draw and update ghosts
    ghosts.forEach(ghost => {
        ghost.update()

        // Check for collision between player and ghosts
        // End the game if a collision occurs
        if(Math.hypot(
            ghost.position.x - player.position.x, 
            ghost.position.y - player.position.y
            ) < 
            ghost.radius + player.radius
        ){
            cancelAnimationFrame(animationId)
        }

        // Collision detection with boundaries for ghost movement
        // Randomly choose a new direction when colliding with boundaries
        const collisions = []
        boundaries.forEach(boundary => {
            if(
                !collisions.includes('right') &&
                circleCollidesWithSquare({
                    circle: {
                    ...ghost,
                    velocity: {
                        x: ghost.speed,
                        y: 0
                    }
                },
                square: boundary
            })
        )   {
            collisions.push('right')
        }
            if(
                !collisions.includes('left') &&
                circleCollidesWithSquare({
                    circle: {
                    ...ghost,
                    velocity: {
                        x: -ghost.speed,
                        y: 0
                    }
                },
                square: boundary
            })
        )   {
            collisions.push('left')
        }
            if(
                !collisions.includes('up') &&
                circleCollidesWithSquare({
                    circle: {
                    ...ghost,
                    velocity: {
                        x: 0,
                        y: -ghost.speed
                    }
                },
                square: boundary
            })
        )   {
            collisions.push('up')
        }
            if(
                !collisions.includes('down') &&
                circleCollidesWithSquare({
                    circle: {
                    ...ghost,
                    velocity: {
                        x: 0,
                        y: ghost.speed
                    }
                },
                square: boundary
            })
        )   {
            collisions.push('down')
        }

      })
      if(collisions.length > ghost.prevCollisions.length)
        ghost.prevCollisions = collisions

        if (JSON.stringify(collisions) !== JSON.stringify(ghost.prevCollisions)){

            if (ghost.velocity.x > 0) ghost.prevCollisions.push('right')
            else if (ghost.velocity.x < 0) ghost.prevCollisions.push('left')
            else if (ghost.velocity.y < 0) ghost.prevCollisions.push('up')
            else if (ghost.velocity.y > 0) ghost.prevCollisions.push('down')

            const pathways = ghost.prevCollisions.filter((collision)  => {
                return !collisions.includes(collision)
            })
            const direction = pathways[Math.floor(Math.random() * pathways.length)]
            
            switch(direction) {
                case 'down':
                    ghost.velocity.y = ghost.speed
                    ghost.velocity.x = 0
                    break

                case 'up':
                    ghost.velocity.y = -ghost.speed
                    ghost.velocity.x = 0
                    break

                case 'right':
                    ghost.velocity.y = 0
                    ghost.velocity.x = ghost.speed
                    break

                case 'left':
                    ghost.velocity.y = 0
                    ghost.velocity.x = -ghost.speed
                    break
            }

            ghost.prevCollisions = []
        }
    })
}

// Start the animation loop
animate()

// Event listeners for key presses and releases
addEventListener('keydown', ({ key }) => {
    // Update the keys object based on key presses
    // Set the last pressed key for movement direction handling
     switch (key) {
        case 'w':
            keys.w.pressed = true
            lastKey = 'w'
            break
        case 'a':
            keys.a.pressed = true
            lastKey = 'a'
            break
        case 's':
            keys.s.pressed = true
            lastKey = 's'
            break
        case 'd':
            keys.d.pressed = true
            lastKey = 'd'
            break
     }
})

addEventListener('keyup', ({ key }) => {
    // Update the keys object based on key releases
    switch (key) {
        case 'w':
            keys.w.pressed = false
            break
        case 'a':
            keys.a.pressed = false
            break
        case 's':
            keys.s.pressed = false
            break
        case 'd':
            keys.d.pressed = false
            break
    }
})