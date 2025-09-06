# Python 3.13.6
import random
import os
# Import session
from flask import Flask, render_template, request, jsonify, Blueprint, session

# Main Flask app
app = Flask(__name__)
# IMPORTANT: Change this to a strong, random key in production!
app.config['SECRET_KEY'] = 'your_super_secret_key_here'

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

# craps_game_state is now managed in Flask session
# global craps_game_state # Remove global variable declaration


def get_craps_game_state():
    if 'craps_game_state' not in session or session['craps_game_state'] is None:
        session['craps_game_state'] = {
            'point': None,
            'round_over': True,
            'last_roll': [],
            'message': 'Welcome to Craps! Roll the dice to start a new round.',
            'player_balance': 1000,
            'active_bets': {
                'pass_line': 0,
                'dont_pass': 0,
                'single_roll': {'type': 'none', 'amount': 0}
            }
        }
    return session['craps_game_state']


def reset_craps_game():
    # global craps_game_state # Remove global keyword
    # Clear craps_game_state from session
    session.pop('craps_game_state', None)
    # Ensure it's re-initialized for the next access
    get_craps_game_state()
    print("[DEBUG] craps_reset called, session state reset.")


@craps_bp.route('/')
def craps_index():
    return render_template('craps_trainer.html')


@craps_bp.route('/craps_roll', methods=['POST'])
def craps_roll():
    # global craps_game_state # Remove global keyword
    craps_game_state = get_craps_game_state()  # Get state from session

    print(f"[DEBUG] craps_roll initial game state: {craps_game_state}")

    if craps_game_state['round_over']:
        # Come out roll
        roll1 = random.randint(1, 6)
        roll2 = random.randint(1, 6)
        total = roll1 + roll2
        craps_game_state['last_roll'] = [roll1, roll2]

        outcome_message = []
        balance_change = 0  # Track net change to balance

        # Process single-roll bets
        single_roll_bet = craps_game_state['active_bets']['single_roll']
        if single_roll_bet['type'] != 'none' and single_roll_bet['amount'] > 0:
            bet_amount = single_roll_bet['amount']
            if single_roll_bet['type'] == 'any-7' and total == 7:
                balance_change += bet_amount * 5  # 4:1 payout + original bet
                outcome_message.append(f'Won ${bet_amount * 4} on Any 7!')
            elif single_roll_bet['type'] == 'any-craps' and (total == 2 or total == 3 or total == 12):
                balance_change += bet_amount * 8  # 7:1 payout + original bet
                outcome_message.append(f'Won ${bet_amount * 7} on Any Craps!')
            elif single_roll_bet['type'] == 'two-or-twelve' and (total == 2 or total == 12):
                balance_change += bet_amount * 31  # 30:1 payout + original bet
                outcome_message.append(f'Won ${bet_amount * 15} on 2 or 12!')
            elif single_roll_bet['type'] == 'three-or-eleven' and (total == 3 or total == 11):
                balance_change += bet_amount * 16  # 15:1 payout + original bet
                outcome_message.append(f'Won ${bet_amount * 15} on 3 or 11!')
            elif single_roll_bet['type'] == 'called-2' and total == 2:
                balance_change += bet_amount * 31  # 30:1 payout + original bet
                outcome_message.append(f'Won ${bet_amount * 30} on Called 2!')
            elif single_roll_bet['type'] == 'called-12' and total == 12:
                balance_change += bet_amount * 31  # 30:1 payout + original bet
                outcome_message.append(f'Won ${bet_amount * 30} on Called 12!')
            else:
                # Loss is already accounted for when placing the bet, no further deduction
                outcome_message.append(
                    f'Lost ${bet_amount} on {single_roll_bet['type']} bet.')
            # Clear single roll bet after processing
            craps_game_state['active_bets']['single_roll'] = {
                'type': 'none', 'amount': 0}

        # Process Pass Line bet on come out roll
        pass_line_bet_amount = craps_game_state['active_bets']['pass_line']
        if pass_line_bet_amount > 0:
            if total == 7 or total == 11:
                # 1:1 payout, so original bet + profit
                balance_change += pass_line_bet_amount * 2
                outcome_message.append(
                    f'Won ${pass_line_bet_amount} on Pass Line!')
            elif total == 2 or total == 3 or total == 12:
                # Loss is already accounted for when placing the bet, no further deduction
                outcome_message.append(
                    f'Lost ${pass_line_bet_amount} on Pass Line.')
            # Bet is cleared later if point is established

        # Process Don't Pass bet on come out roll
        dont_pass_bet_amount = craps_game_state['active_bets']['dont_pass']
        if dont_pass_bet_amount > 0:
            if total == 2 or total == 3:
                balance_change += dont_pass_bet_amount * 2  # 1:1 payout
                outcome_message.append(
                    f'Won ${dont_pass_bet_amount} on Don\'t Pass!')
            elif total == 7 or total == 11:
                # Loss is already accounted for when placing the bet, no further deduction of original bet
                # but we explicitly make balance_change -= 0 here to ensure it's handled in the sum of balance_change
                # Explicitly show no additional change, as original bet was already deducted.
                balance_change -= 0
                outcome_message.append(
                    f'Lost ${dont_pass_bet_amount} on Don\'t Pass.')
            elif total == 12:
                balance_change += dont_pass_bet_amount  # Push, return original bet
                outcome_message.append(
                    f'Don\'t Pass: Push on 12, bet returned.')
            # Bet is cleared later if point is established

        if total == 7 or total == 11:
            craps_game_state['message'] = f'Rolled {total}. Natural! Round Over.'
            craps_game_state['round_over'] = True
            # Clear pass/dont pass bets here as round ends
            craps_game_state['active_bets']['pass_line'] = 0
            craps_game_state['active_bets']['dont_pass'] = 0
        elif total == 2 or total == 3 or total == 12:
            craps_game_state['message'] = f'Rolled {total}. Craps! Round Over.'
            craps_game_state['round_over'] = True
            # Clear pass/dont pass bets here as round ends
            craps_game_state['active_bets']['pass_line'] = 0
            craps_game_state['active_bets']['dont_pass'] = 0
        else:
            craps_game_state['point'] = total
            craps_game_state['round_over'] = False
            craps_game_state['message'] = f'Rolled {total}. Point is {total}. Roll again to hit your point or a 7 to lose.'
            # Pass/Don't Pass bets remain active if point is established

        craps_game_state['player_balance'] += balance_change
        print(
            f"[DEBUG] craps_roll after processing, balance_change: {balance_change}, new balance: {craps_game_state['player_balance']}")
        if outcome_message:
            craps_game_state['message'] += "\n" + "\n".join(outcome_message)
        else:
            craps_game_state['message'] += f"\n(Balance: ${craps_game_state['player_balance']})"
        # IMPORTANT: Explicitly save the modified state back to the session
        session['craps_game_state'] = craps_game_state

    else:
        # Point established roll
        roll1 = random.randint(1, 6)
        roll2 = random.randint(1, 6)
        total = roll1 + roll2
        craps_game_state['last_roll'] = [roll1, roll2]

        outcome_message = []
        balance_change = 0  # Track net change to balance

        # Process single-roll bets (always cleared after each roll)
        single_roll_bet = craps_game_state['active_bets']['single_roll']
        if single_roll_bet['type'] != 'none' and single_roll_bet['amount'] > 0:
            bet_amount = single_roll_bet['amount']
            if single_roll_bet['type'] == 'any-7' and total == 7:
                balance_change += bet_amount * 5  # 4:1 payout + original bet
                outcome_message.append(f'Won ${bet_amount * 4} on Any 7!')
            elif single_roll_bet['type'] == 'any-craps' and (total == 2 or total == 3 or total == 12):
                balance_change += bet_amount * 8  # 7:1 payout + original bet
                outcome_message.append(f'Won ${bet_amount * 7} on Any Craps!')
            elif single_roll_bet['type'] == 'two-or-twelve' and (total == 2 or total == 12):
                balance_change += bet_amount * 31  # 30:1 payout + original bet
                outcome_message.append(f'Won ${bet_amount * 30} on 2 or 12!')
            elif single_roll_bet['type'] == 'three-or-eleven' and (total == 3 or total == 11):
                balance_change += bet_amount * 16  # 15:1 payout + original bet
                outcome_message.append(f'Won ${bet_amount * 15} on 3 or 11!')
            else:
                # Loss is already accounted for when placing the bet, no further deduction
                outcome_message.append(
                    f'Lost ${bet_amount} on {single_roll_bet['type']} bet.')
            # Clear single roll bet after processing
            craps_game_state['active_bets']['single_roll'] = {
                'type': 'none', 'amount': 0}

        if total == craps_game_state['point']:
            craps_game_state['message'] = f'Rolled {total}. You hit your Point! Round Over.'
            # Process Pass Line bet
            pass_line_bet_amount = craps_game_state['active_bets']['pass_line']
            if pass_line_bet_amount > 0:
                balance_change += pass_line_bet_amount * 2
                outcome_message.append(
                    f'Won ${pass_line_bet_amount} on Pass Line!')
            craps_game_state['active_bets']['pass_line'] = 0

            # Process Don't Pass bet (loses)
            dont_pass_bet_amount = craps_game_state['active_bets']['dont_pass']
            if dont_pass_bet_amount > 0:
                # Loss is already accounted for when placing the bet, no further deduction
                outcome_message.append(
                    f'Lost ${dont_pass_bet_amount} on Don\'t Pass.')
            craps_game_state['active_bets']['dont_pass'] = 0

            craps_game_state['round_over'] = True
            craps_game_state['point'] = None
        elif total == 7:
            craps_game_state['message'] = f'Rolled {total}. Seven Out! Round Over.'
            # Process Pass Line bet (loses)
            pass_line_bet_amount = craps_game_state['active_bets']['pass_line']
            if pass_line_bet_amount > 0:
                # Loss is already accounted for when placing the bet, no further deduction
                outcome_message.append(
                    f'Lost ${pass_line_bet_amount} on Pass Line.')
            craps_game_state['active_bets']['pass_line'] = 0

            # Process Don't Pass bet (wins)
            dont_pass_bet_amount = craps_game_state['active_bets']['dont_pass']
            if dont_pass_bet_amount > 0:
                balance_change += dont_pass_bet_amount * 2
                outcome_message.append(
                    f'Won ${dont_pass_bet_amount} on Don\'t Pass!')
            craps_game_state['active_bets']['dont_pass'] = 0

            craps_game_state['round_over'] = True
            craps_game_state['point'] = None
        else:
            craps_game_state['message'] = f'Rolled {total}. Point is {craps_game_state['point']}. Roll again.'
            # Bets remain active

        craps_game_state['player_balance'] += balance_change
        print(
            f"[DEBUG] craps_roll after processing, balance_change: {balance_change}, new balance: {craps_game_state['player_balance']}")
        if outcome_message:
            craps_game_state['message'] += f"\n(Balance: ${craps_game_state['player_balance']})\n" + "\n".join(
                outcome_message)
        else:
            craps_game_state['message'] += f"\n(Balance: ${craps_game_state['player_balance']})"
        # IMPORTANT: Explicitly save the modified state back to the session
        session['craps_game_state'] = craps_game_state

    return jsonify(craps_game_state)


@craps_bp.route('/place_bets', methods=['POST'])
def craps_place_bets():
    # global craps_game_state # Remove global keyword
    craps_game_state = get_craps_game_state()  # Get state from session
    data = request.json

    print(f"[DEBUG] craps_place_bets received data: {data}")
    print(
        f"[DEBUG] craps_place_bets initial balance: {craps_game_state['player_balance']}")

    pass_line_bet = data.get('pass_line_bet', 0)
    dont_pass_bet = data.get('dont_pass_bet', 0)
    single_roll_bet_type = data.get('single_roll_bet_type', 'none')
    single_roll_bet_amount = data.get('single_roll_bet_amount', 0)

    # Reset active bets before setting new ones
    craps_game_state['active_bets'] = {
        'pass_line': pass_line_bet,  # Set new pass line bet
        'dont_pass': dont_pass_bet,  # Set new don't pass bet
        'single_roll': {'type': single_roll_bet_type, 'amount': single_roll_bet_amount}
    }

    # Validate bets and update balance
    # Only deduct if game is not in a round, and allow placing 0 bets to clear previous.
    if craps_game_state['round_over']:
        total_bet_amount = pass_line_bet + dont_pass_bet + single_roll_bet_amount

        if total_bet_amount > craps_game_state['player_balance']:
            return jsonify({'success': False, 'message': 'Insufficient balance to place bets.'}), 400

        if pass_line_bet < 0 or dont_pass_bet < 0 or single_roll_bet_amount < 0:
            return jsonify({'success': False, 'message': 'Bet amounts cannot be negative.'}), 400

        craps_game_state['player_balance'] -= total_bet_amount
        print(
            f"[DEBUG] craps_place_bets deducted {total_bet_amount}. New balance: {craps_game_state['player_balance']}")
        # IMPORTANT: Explicitly save the modified state back to the session
        session['craps_game_state'] = craps_game_state

        # Return the full game state so frontend can update consistently
        craps_game_state['message'] = 'Bets placed successfully!'
        return jsonify(craps_game_state)
    else:
        print(
            f"[DEBUG] craps_place_bets failed: {craps_game_state['message']}")
        return jsonify({'success': False, 'message': 'Cannot place bets during an active round. Please wait for the current round to finish.'}), 400


@craps_bp.route('/craps_reset', methods=['POST'])
def craps_reset():
    # global craps_game_state # Remove global keyword
    reset_craps_game()
    # After reset, ensure active bets are also reset on the frontend
    # craps_game_state['active_bets'] = { # This line is no longer needed as reset_craps_game handles session clearing
    #     'pass_line': 0,
    #     'dont_pass': 0,
    #     'single_roll': {'type': 'none', 'amount': 0}
    # }
    # Make sure to return the newly reset state from the session
    return jsonify(get_craps_game_state())


# Register blueprints
app.register_blueprint(dice_bp, url_prefix='/')
app.register_blueprint(craps_bp, url_prefix='/craps')

if __name__ == "__main__":
    print("Welcome to the Dice Rolling Simulator!")

    app.run(debug=True)
