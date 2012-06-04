/**
 * Shooting Game
 */

enchant();
window.onload = function () {
    game = new Game(320, 320);
    game.fps = 24;
    game.score = 0;
    game.touched = false;
    game.preload('./images/bg.png', './images/graphic.png', './images/player.gif', './images/enemy.gif', './images/shot.gif');
    game.onload = function () {
        player = new Player(160 - 16, 320 - 32 - 16);
        enemies = {}; 
        
        game.rootScene.backgroundColor = '#E0FFFF';

        game.rootScene.addEventListener('enterframe', function () {
            if(rand(1500) < game.frame / 20 * Math.sin(game.frame / 100) + game.frame / 20 + 50) {
                var enemyCount = 0;
                for (var i in enemies) {
                    enemyCount++;
                }
                if(enemyCount < 15){
                    var x = rand(320); // Appear Position
                    var v = (rand(6)-3) * 3; // x Velocity
                    if(v == 0) v = 1;
                    var enemy = new Enemy(x, -32, v);
                    enemy.key = game.frame;
                    enemies[game.frame] = enemy;
                }
            }
            scoreLabel.score = game.score;
        });

        // Score Label
        scoreLabel = new ScoreLabel(8, 8);
        game.rootScene.addChild(scoreLabel);

        // Backgound Image
        var bg = new Sprite(320, 16);
        bg.image = game.assets['./images/bg.png'];
        bg.y = 320 - 16;
        game.rootScene.addChild(bg);
    };
    game.start();
};



/**
 * Charactor
 */
var Player = enchant.Class.create(enchant.Sprite, {
    initialize: function (x, y) {
        enchant.Sprite.call(this, 32, 32);
        this.image = game.assets['./images/player.gif'];
        this.x = x;
        this.y = y;
        this.frame = 0;
        this.scaleX = 1;
        game.keybind(90, 'a'); // z key

        this.addEventListener('enterframe', this.move);

        game.rootScene.addChild(this);
    },

    move: function(){
         this.frame = (this.frame + 1) % 3;
          
         // Shoot
         if(game.input.a && game.frame % 3 == 0) {
             var s = new PlayerShoot(this.x + 8, this.y - 16);
         }

         // Move
         if (game.input.left){
             this.x -= 5;
             this.scaleX = -1;
         }else if (game.input.right){
             this.x += 5;
             this.scaleX = 1;
         }

         if(this.x < 0){
             this.x = 0;
         }else if(this.x > 320 - this.width){
             this.x = 320 - this.width;
         }
    }
});

var Enemy = enchant.Class.create(enchant.Sprite, {
     initialize: function (x, y, velocity_x) {
        enchant.Sprite.call(this, 32, 32);
        this.MAX_FALL_VELOCITY = 23;
        this.image = game.assets['./images/enemy.gif'];
        this.x = x;
        this.y = y;
        this.velocity_y = 0.0;
        this.velocity_x = velocity_x;

        this.frame = 3;
        this.moveSpeed = 3;

        this.addEventListener('enterframe', this.move);
        
        game.rootScene.addChild(this);
    },

    move: function () {
        this.frame = (this.frame + 1) % 3;

        // Move
        this.y += this.velocity_y;
        this.x += this.velocity_x;

        // Direction Chenge
        if(this.x < 0){
            this.velocity_x *= -1;
            this.x = 0
        }else if(this.x > 320 - this.width){
            this.velocity_x *= -1;
            this.x = 320 - this.width;
        }
       
        // Free Fall
        if(this.velocity_y < this.MAX_FALL_VELOCITY){
            this.velocity_y++;
        }
        
        // Bouncing
        if(this.y > 320 - this.height - 16){
            this.velocity_y *=- 0.9;
            this.y = 320 - this.height - 16;
        }

        // Collision
        if(player.within(this, this.height/2)) {
            game.end(game.score, "SCORE: " + game.score)
        }
    },

    remove: function () {
        game.rootScene.removeChild(this);
        delete enemies[this.key];
    }
});

/**
 * Shoot
 */
var Shoot = enchant.Class.create(enchant.Sprite, {
    initialize: function (x, y, direction) {
        enchant.Sprite.call(this, 16, 16);
        this.image = game.assets['./images/shot.gif'];
        this.rate = 1;
        this.x = x;
        this.y = y;
        this.frame = 0;
        this.direction = direction;
        this.moveSpeed = 10;

        this.addEventListener('enterframe', this.move);

        game.rootScene.addChild(this);
    },

    move: function(){
        this.frame = (this.frame + 1 ) % 4;
        this.x += this.moveSpeed * Math.cos(this.direction);
        this.y += this.moveSpeed * Math.sin(this.direction);
        if(this.y > 320 || this.x > 320 || this.x < -this.width || this.y < -this.height) {
            this.remove();
        }
        this.checkCollision();
    },

    checkCollision: function(){
        for (var i in enemies) {
           if(enemies[i].intersect(this)) {
             enemies[i].remove();
             this.hit();
             this.remove();
           }
        }
    },

    hit: function(){
        this.addScore(this.rate);
        for(var i = 0; i < 3 ; i++){
            new EnemyShoot(this.x, this.y, 2 * Math.PI * Math.random(), this.rate * 2);
        }
    },

    addScore: function(score){
        game.score += score;
        new Score(this.x, this.y, score);
    },

    remove: function () {
        game.rootScene.removeChild(this);
        delete this;
    }
});

var PlayerShoot = enchant.Class.create(Shoot, {
    initialize: function (x, y) {
        Shoot.call(this, x, y, Math.PI*3/2);
        this.rate = 1;
    },

});

var EnemyShoot = enchant.Class.create(Shoot, {
    initialize: function (x, y, direction, rate) {
        Shoot.call(this, x, y, direction);
        this.rate = rate; 
        this.deathCountDown = 10;

        this.addEventListener('enterframe', function () {
            this.deathCountDown --;
            if(this.deathCountDown < 0) this.remove();
        });
    }
});

/**
 * Score Label Object
 */
var Score = enchant.Class.create(Label, {
    initialize : function (x, y, score){
        enchant.Label.call(this, score);
        this.MAX_COUNT = 20;
        this.x = x;
        this.y = y;
        this.count = this.MAX_COUNT;
        this._element.style.opacity = 1.0;

        this.addEventListener('enterframe', function () {
            this.count--;
            this.y--;
            this._element.style.opacity = this.count / this.MAX_COUNT;
            if(this.count <= 0){
               game.rootScene.removeChild(this);
            }
        });

        game.rootScene.addChild(this);
    }
});
