/**
 * Bakuretsu Kumasan
 */

enchant();
window.onload = function () {
    game = new Game(320, 320);
    game.MAX_ENEMY = 50;
    game.fps = 24;
    game.preload('./images/bg.png',
                 './images/player.gif',
                 './images/enemy.gif',
                 './images/shot.gif',
                 './images/heart.png');
    /**
     * Input Setting 
     */
    game.touchLeft = false;
    game.touchRight = false;
    game.touchCenter = false;

    // Touch Input
    game.rootScene.addEventListener(Event.TOUCH_START, function(e){
        if(e.x < game.width/3){
            game.touchLeft = true;
        }else if(e.x >= game.width/3 && e.x <= game.width * 2 /3){
            game.touchCenter = true;
        }else if(e.x > game.width * 2 / 3){
            game.touchRight = true;
        }
    });
    game.rootScene.addEventListener(Event.TOUCH_END, function(e){
            game.touchLeft = false;
            game.touchRight = false;
            game.touchCenter = false;
    });

    // Integral Key Input
    game.keybind(90, 'a'); // z key
    game.inputLeft = function(){
        if(game.input.left || game.touchLeft){
            return true;
        }
        return false;
    }
    game.inputRight = function(){
        if(game.input.right || game.touchRight){
            return true;
        }
        return false;
    }
    game.inputCenter = function(){
        if(game.input.a || game.touchCenter){
            return true;
        }
        return false;
    }

    /**
     * Init Game
     */
    game.onload = function (){
        game.score = 0;
        game.rootScene.backgroundColor = '#E0FFFF';

        // Score Label
        game.scoreLabel = new ScoreLabel(8, 8);
        game.rootScene.addChild(game.scoreLabel);

        // Backgound Image
        game.bg = new Sprite(game.width, 16);
        game.bg.image = game.assets['./images/bg.png'];
        game.bg.y = game.height - 16;
        game.rootScene.addChild(game.bg);

        game.player = new Player((game.width - 32)/ 2, game.height - 32 - game.bg.height);
        game.enemies = {}; 
        game.shootCount = 0;
        game.revivalCount = 0;
    }

    /**
     * Main Loop
     */
    game.rootScene.addEventListener('enterframe', function(){
        // Spawn Enemy
        var ea = game.frame / 10  * Math.sin(game.frame / 100) + game.frame / 10 + 80;
        if(ea > 600){
          ea = 600;
        }

        if(rand(1500) < ea) {
            var enemyCount = 0;
            for (var i in game.enemies) {
                enemyCount++;
            }
            if(enemyCount < game.MAX_ENEMY){
                var x = rand(game.width); // Appear Position
                var v = (rand(6)-3) * 3; // x Velocity
                if(v == 0) {
                    v = 1;
                }
                var enemy = new Enemy(x, - 32, v);
                enemy.key = game.frame;
                game.enemies[game.frame] = enemy;
            }
        }
        
        // Death Count Down & GameOver
        if(game.player.dead && game.shootCount <= 0){
            game.end(game.score, "SCORE: " + game.score)
        }else if(game.player.tempDead){
            if(game.player.deathCountDown == game.fps * 3 -1){
                new CountDown(game.player.x + 8, game.player.y - 32, 3, "#AAAAAA");
            }else if(game.player.deathCountDown == game.fps * 2 -1){
                new CountDown(game.player.x + 8, game.player.y - 32, 2, "#AAAA33");
            }else if(game.player.deathCountDown == game.fps * 1 -1){
                new CountDown(game.player.x + 8, game.player.y - 32, 1, "#AA0000");
            }
        }

        // Socre Label
        game.scoreLabel.score = game.score;
    });

    /**
     * GameStart
     */
    game.start();
}

/**
 * Charactor
 */
var Player = enchant.Class.create(enchant.Sprite, {
    initialize: function (x, y) {
        enchant.Sprite.call(this, 32, 32);
        this.DEATH_COUNT_LIMIT = game.fps * 3;
        this.image = game.assets['./images/player.gif'];
        this.buttonDown = false;
        this.x = x;
        this.y = y;
        this.frame = 0;
        this.scaleX = 1;
        this.tempDead = false;
        this.rivivalCount = 0;
        this.deathCountDown = 0;
        this.dead = false;
        this.challenge = 3;

        this.addEventListener('enterframe', this.update);
        game.rootScene.addChild(this);
    },

    update : function (){
        if(!this.tempDead){
            this.move();
        }else{
            this.tryRivival();
        }
    },

    move: function(){
         this.frame = (this.frame + 1) % 3;
          
         // Shoot
         if(game.inputCenter() && game.frame % 3 == 0) {
             var s = new PlayerShoot(this.x + 8, this.y - 16);
         }

         // Move
         if (game.inputLeft()){
             this.x -= 5;
             this.scaleX = -1;
         }else if (game.inputRight()){
             this.x += 5;
             this.scaleX = 1;
         }

         if(this.x < 0){
             this.x = 0;
         }else if(this.x > game.width - this.width){
             this.x = game.width - this.width;
         }
    },

    tryRivival : function (){
        if(game.inputLeft() && this.buttonDown == false){
            this.rivivalCount++;
            if(this.rivivalCount >= this.challenge){
                this.rivival();
                return;
            }
            this.scaleX = -1;
            this.buttonDown = true;
        }else if(game.inputRight()){
            this.scaleX = 1;
            this.buttonDown = false;
        }

        if(this.deathCountDown <= 0){
            this.death();
        }
        this.deathCountDown--;
    },

    rivival : function (){
        this.rivivalCount = 0;
        this.tempDead = false;
        this.challenge += 1;
    },

    tempDeath : function (){
        if(this.tempDead) return;
        this.tempDead = true;
        this.rivivalCount = 0;
        this.deathCountDown = this.DEATH_COUNT_LIMIT;
        this.frame = 3;
    },

    death : function(){
        this.dead = true;
        game.rootScene.removeChild(this);
        game.score += 1;
        new Score(this.x, this.y, 1);

        for(var i = 0; i < 5 ; i++){
            new EnemyShoot(this.x, this.y, 2 * Math.PI * Math.random(), 2);
        }
    },

    cure : function(){
        this.challenge -= 2;
        if(this.challenge <= 4){
            this.challenge = 4;
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
        }else if(this.x > game.width - this.width){
            this.velocity_x *= -1;
            this.x = game.width - this.width;
        }
       
        // Free Fall
        if(this.velocity_y < this.MAX_FALL_VELOCITY){
            this.velocity_y++;
        }
        
        // Bouncing
        if(this.y > game.width - this.height - 8){
            this.velocity_y *=- 0.9;
            this.y = game.width - this.height - 8;
        }

        // Collision
        if(game.player.within(this, this.height/2)) {
            if(!game.player.tempDead){
                game.player.tempDeath();
            }
        }
    },

    remove: function (rate) {
        this.addScore(rate);
        var nextRate;

        // Max Score
        if(rate >= 9999){
            nextRate = 9999;
        }else{
            nextRate = rate * 2;
        }

        // Cure Item
        if(rate >= 1024){
            new Heart(rand(game.width - 20), - 32);
        }

        for(var i = 0; i < 5 ; i++){
            new EnemyShoot(this.x, this.y, 2 * Math.PI * Math.random(), nextRate);
        }
  
        game.rootScene.removeChild(this);
        delete game.enemies[this.key];
    },

    addScore: function(score){
        game.score += score;
        new Score(this.x, this.y, score);
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
        this.moveSpeed = 13;
        this.dead = false;

        this.addEventListener('enterframe', this.move);

        game.rootScene.addChild(this);
        game.shootCount++;
    },

    move: function(){
        this.frame = (this.frame + 1 ) % 4;
        this.x += this.moveSpeed * Math.cos(this.direction);
        this.y += this.moveSpeed * Math.sin(this.direction);
        if(this.y > game.width || this.x > game.width || this.x < -this.width || this.y < -this.height) {
            this.remove();
        }
        this.checkCollision();
    },

    checkCollision: function(){
        for (var i in game.enemies) {
           if(game.enemies[i].intersect(this)) {
             game.enemies[i].remove(this.rate);
             this.remove();
           }
        }
    },

    remove: function () {
        if(this.dead) return;
        game.rootScene.removeChild(this);
        game.shootCount--;
        this.dead = true;
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
        this.deathCountDown = 8;

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
        this.font = "12px cursive";
        if(score >= 1024){
            this.color = "#FF0000";
        }

        this.addEventListener('enterframe', function () {
            this.count--;
            this.y--;
            this._element.style.opacity = this.count / this.MAX_COUNT;
            if(this.count <= 0){
                this.remove();
            }
        });

        game.rootScene.addChild(this);
    },

    remove : function(){
        game.rootScene.removeChild(this);
        delete this;
    }
});

/**
 * Count Down Label Object
 */
var CountDown = enchant.Class.create(Label, {
    initialize : function (x, y, count, color){
        enchant.Label.call(this, count);
        this.MAX_COUNT = game.fps;
        this.x = x;
        this.y = y;
        this.count = this.MAX_COUNT;
        this._element.style.opacity = 1.0;
        this.font = "24px cursive";
        this.color = color;

        this.addEventListener('enterframe', function () {
            this.count--;
            this.y--;
            this._element.style.opacity = this.count / this.MAX_COUNT;
            if(this.count <= 0){
                this.remove();
            }
        });

        game.rootScene.addChild(this);
    },

    remove : function(){
        game.rootScene.removeChild(this);
        delete this;
    }
});

/**
 * Cure Life 
 */
var Heart = enchant.Class.create(Sprite, {
    initialize: function (x, y) {
        enchant.Sprite.call(this, 20, 20);
        this.COUNT_DOWN = game.fps * 3;
        this.image = game.assets['./images/heart.png'];
        this.x = x;
        this.y = y;
        this.frame = 0;
        this.count = 0;

        this.addEventListener('enterframe', this.move);
        game.rootScene.addChild(this);
    },

    move : function(){
        this.y += 2;
        if(this.y >= game.width - game.bg.height - this.height){
            this.y = game.width - game.bg.height - this.height;
            this.count ++;
        }

        if(this.count >= game.fps){
            if(this.count % 2 == 0){
                this._element.style.opacity = 0.0;
            }else{
                this._element.style.opacity = 1.0;
            }
        }
        
        if(this.count >= this.COUNT_DOWN){
            this.remove();
        }

        // Collision
        if(game.player.within(this, this.height)) {
            game.player.cure();
            this.remove();
        }
    },

    remove : function(){
        game.rootScene.removeChild(this);
        delete this;
    }
});
