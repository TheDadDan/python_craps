 # Modified by TheDadDan on 2026-03-07 — testing Git workflow 
# Python 3.13.6
import random
import os
from dotenv import load_dotenv
from flask import Flask, render_template, request, jsonify, Blueprint

load_dotenv()

# Main Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your_super_secret_key_here')

# Dice Rolling App Blueprint
dice_bp = Blueprint('dice_app', __name__,
                    template_folder=os.path.join(
                        app.root_path, 'web_app', 'templates'),
                    static_folder=os.path.join(
                        app.root_path, 'web_app', 'static'),
                    static_url_path='/static/dice_app')

# Configure a separate static folder and URL path for the craps app
# app.static_folder_craps = 'craps_app'
# app.static_url_path_craps = '/static_craps'


def roll_dice(num_dice, num_sides):
    """Simulates rolling a specified number of dice with a given number of sides."""
    rolls = []
    for _ in range(num_dice):
        rolls.append(random.randint(1, num_sides))
    return rolls


@dice_bp.route('/')
def index():
    return render_template('dice_simulator.html')


@dice_bp.route('/roll', methods=['POST'])
def roll():
    num_dice = request.json.get('num_dice')
    num_sides = request.json.get('num_sides')

    if not isinstance(num_dice, int) or not isinstance(num_sides, int) or num_dice <= 0 or num_sides <= 0:
        return jsonify({'error': 'Please provide valid positive numbers for dice and sides.'}), 400

    results = roll_dice(num_dice, num_sides)
    return jsonify({'results': results, 'total': sum(results)})


# Craps Trainer App Blueprint
craps_bp = Blueprint('craps_app', __name__,
                     template_folder=os.path.join(
                         app.root_path, 'craps_app', 'templates'),
                     static_folder=os.path.join(
                         app.root_path, 'craps_app', 'static'),
                     static_url_path='/static/craps_app')

@craps_bp.route('/')
def craps_index():
    return render_template('craps_trainer.html')


# Dice Invaders App Blueprint
dice_invaders_bp = Blueprint('dice_invaders_app', __name__,
                    template_folder=os.path.join(
                        app.root_path, 'dice_invaders_app', 'templates'),
                    static_folder=os.path.join(
                        app.root_path, 'dice_invaders_app', 'static'),
                    static_url_path='/static/dice_invaders_app')


@dice_invaders_bp.route('/')
def dice_invaders_index():
    return render_template('dice_invaders.html')


# Register blueprints
app.register_blueprint(dice_bp, url_prefix='/')
app.register_blueprint(craps_bp, url_prefix='/craps')
app.register_blueprint(dice_invaders_bp, url_prefix='/dice-invaders')

if __name__ == "__main__":
    print("Welcome to the Dice Rolling Simulator!")

    app.run(debug=True)
