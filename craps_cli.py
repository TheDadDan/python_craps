#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Craps Trainer CLI - Enhanced UI Version
A polished terminal-based craps trainer with visual feedback and clear gameplay.
"""

import random
import os
import sys

# ANSI color codes for visual feedback
class Colors:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    GREEN = "\033[92m"
    RED = "\033[91m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    CYAN = "\033[96m"
    MAGENTA = "\033[95m"
    
    @classmethod
    def clear(cls):
        """Clear the terminal screen."""
        os.system('cls' if os.name == 'nt' else 'clear')

class DiceVisual:
    """ASCII art dice representations."""
    DICE_ART = {
        1: [
            "┌───────┐",
            "│       │",
            "│   ●   │",
            "│       │",
            "└───────┘"
        ],
        2: [
            "┌───────┐",
            "│ ●     │",
            "│       │",
            "│     ● │",
            "└───────┘"
        ],
        3: [
            "┌───────┐",
            "│ ●     │",
            "│   ●   │",
            "│     ● │",
            "└───────┘"
        ],
        4: [
            "┌───────┐",
            "│ ●   ● │",
            "│       │",
            "│ ●   ● │",
            "└───────┘"
        ],
        5: [
            "┌───────┐",
            "│ ●   ● │",
            "│   ●   │",
            "│ ●   ● │",
            "└───────┘"
        ],
        6: [
            "┌───────┐",
            "│ ●   ● │",
            "│ ●   ● │",
            "│ ●   ● │",
            "└───────┘"
        ]
    }
    
    @classmethod
    def print_dice_pair(cls, roll1, roll2):
        """Print two dice side by side."""
        lines1 = cls.DICE_ART[roll1]
        lines2 = cls.DICE_ART[roll2]
        
        print(f"\n{Colors.CYAN}{Colors.BOLD}┌─────────────────────────────────────────────────────┐{Colors.RESET}")
        print(f"{Colors.CYAN}│{Colors.RESET} {Colors.YELLOW}Rolling...{Colors.RESET}".center(55) + f"{Colors.CYAN}│{Colors.RESET}")
        print(f"{Colors.CYAN}├─────────────────────────────────────────────────────┤{Colors.RESET}")
        
        for i in range(5):
            print(f"{Colors.CYAN}│{Colors.RESET}  {lines1[i]}  {Colors.CYAN}│{Colors.RESET}  {lines2[i]}  {Colors.CYAN}│{Colors.RESET}")
        
        print(f"{Colors.CYAN}└─────────────────────────────────────────────────────┘{Colors.RESET}")
        print(f"  ({Colors.MAGENTA}{roll1}{Colors.RESET} + {Colors.MAGENTA}{roll2}{Colors.RESET} = {Colors.GREEN}{Colors.BOLD}{roll1 + roll2}{Colors.RESET})")

class CrapsGame:
    """Main Craps game logic with enhanced UI."""
    
    def __init__(self):
        self.point = None
        self.round_over = True
        self.player_balance = 1000
        self.active_bets = {
            'pass_line': 0,
            'dont_pass': 0,
            'single_roll': {'type': 'none', 'amount': 0}
        }
        self.last_roll = []
        
    def roll_dice(self):
        """Simulate rolling two six-sided dice."""
        roll1 = random.randint(1, 6)
        roll2 = random.randint(1, 6)
        self.last_roll = [roll1, roll2]
        return roll1, roll2, roll1 + roll2
    
    def place_bets(self):
        """Handle bet placement with validation."""
        Colors.clear()
        self.print_header()
        
        print(f"\n{Colors.CYAN}{Colors.BOLD}Place Your Bets{Colors.RESET}")
        print(f"{Colors.RESET}Current Balance: {Colors.GREEN}${self.player_balance}{Colors.RESET}")
        print()
        
        try:
            pass_line = int(input(f"{Colors.YELLOW}Pass Line Bet: $"))
            dont_pass = int(input(f"{Colors.YELLOW}Don't Pass Bet: $"))
            
            if pass_line < 0 or dont_pass < 0:
                print(f"{Colors.RED}❌ Bet amounts cannot be negative.{Colors.RESET}")
                input(f"\n{Colors.CYAN}Press Enter to continue...{Colors.RESET}")
                return False
            
            total_bets = pass_line + dont_pass
            if total_bets > self.player_balance:
                print(f"{Colors.RED}❌ Insufficient balance! You have ${self.player_balance}.{Colors.RESET}")
                input(f"\n{Colors.CYAN}Press Enter to continue...{Colors.RESET}")
                return False
            
            self.active_bets['pass_line'] = pass_line
            self.active_bets['dont_pass'] = dont_pass
            
            # Optional single-roll bets
            choice = input(f"\n{Colors.YELLOW}Add single-roll bets? (y/n): {Colors.RESET}").lower()
            if choice == 'y':
                print(f"\n{Colors.CYAN}Single Roll Bet Options:{Colors.RESET}")
                print(f"  {Colors.MAGENTA}1{Colors.RESET}. Any 7 (pays 4:1)")
                print(f"  {Colors.MAGENTA}2{Colors.RESET}. Any Craps (2,3,12) - pays 7:1")
                print(f"  {Colors.MAGENTA}3{Colors.RESET}. 2 or 12 - pays 30:1")
                print(f"  {Colors.MAGENTA}4{Colors.RESET}. 3 or 11 - pays 15:1")
                
                bet_type = input(f"{Colors.YELLOW}Choose bet type (1-4): {Colors.RESET}")
                amount = int(input(f"{Colors.YELLOW}Bet amount: $"))
                
                types = {1: 'any-7', 2: 'any-craps', 3: 'two-or-twelve', 4: 'three-or-eleven'}
                self.active_bets['single_roll'] = {
                    'type': types.get(int(bet_type), 'none'),
                    'amount': amount
                }
            
            self.player_balance -= total_bets
            if self.active_bets['single_roll']['amount'] > 0:
                self.player_balance -= self.active_bets['single_roll']['amount']
            
            print(f"\n{Colors.GREEN}✅ Bets placed successfully!{Colors.RESET}")
            print(f"   Pass Line: ${pass_line}")
            print(f"   Don't Pass: ${dont_pass}")
            if self.active_bets['single_roll']['type'] != 'none':
                print(f"   Single Roll: ${self.active_bets['single_roll']['amount']} ({self.active_bets['single_roll']['type']})")
            print(f"   Remaining Balance: ${self.player_balance}")
            
            input(f"\n{Colors.CYAN}Press Enter to roll...{Colors.RESET}")
            return True
            
        except ValueError:
            print(f"{Colors.RED}❌ Invalid input. Please enter numbers only.{Colors.RESET}")
            input(f"\n{Colors.CYAN}Press Enter to continue...{Colors.RESET}")
            return False
    
    def print_header(self):
        """Print the game header."""
        Colors.clear()
        print(f"{Colors.CYAN}{Colors.BOLD}")
        print("╔═══════════════════════════════════════════════════════════╗")
        print("║           🎲  WELCOME TO CRAPS TRAINER  🎲               ║")
        print("╚═══════════════════════════════════════════════════════════╝")
        print(f"{Colors.RESET}")
    
    def print_status(self, message, balance_change=0):
        """Print game status with visual feedback."""
        print(f"\n{Colors.CYAN}{'─' * 60}{Colors.RESET}")
        print(f"{Colors.RESET}{message}")
        
        if balance_change != 0:
            color = Colors.GREEN if balance_change > 0 else Colors.RED
            symbol = "+" if balance_change > 0 else ""
            print(f"\n{color}Balance Change: {symbol}${balance_change}{Colors.RESET}")
        
        print(f"{Colors.CYAN}{'─' * 60}{Colors.RESET}")
        print(f"\n{Colors.YELLOW}Current Balance: ${self.player_balance}{Colors.RESET}")
        
        if self.point:
            print(f"{Colors.MAGENTA}Point: {self.point}{Colors.RESET}")
        print()
    
    def play_round(self):
        """Execute a single craps round."""
        if self.round_over:
            # Come out roll
            Colors.clear()
            self.print_header()
            
            if not self.active_bets['pass_line'] and not self.active_bets['dont_pass']:
                print(f"\n{Colors.YELLOW}No bets placed!{Colors.RESET}")
                input(f"{Colors.CYAN}Press Enter to place bets...{Colors.RESET}")
                if not self.place_bets():
                    return  # Go back to menu
            
            roll1, roll2, total = self.roll_dice()
            DiceVisual.print_dice_pair(roll1, roll2)
            
            balance_change = 0
            messages = []
            
            # Process single-roll bets
            if self.active_bets['single_roll']['type'] != 'none':
                bet = self.active_bets['single_roll']
                amount = bet['amount']
                
                if bet['type'] == 'any-7' and total == 7:
                    payout = amount * 4
                    balance_change += payout
                    messages.append(f"{Colors.GREEN}✅ Won ${payout} on Any 7!{Colors.RESET}")
                elif bet['type'] == 'any-craps' and total in [2, 3, 12]:
                    payout = amount * 7
                    balance_change += payout
                    messages.append(f"{Colors.GREEN}✅ Won ${payout} on Any Craps!{Colors.RESET}")
                elif bet['type'] == 'two-or-twelve' and total in [2, 12]:
                    payout = amount * 30
                    balance_change += payout
                    messages.append(f"{Colors.GREEN}✅ Won ${payout} on 2 or 12!{Colors.RESET}")
                elif bet['type'] == 'three-or-eleven' and total in [3, 11]:
                    payout = amount * 15
                    balance_change += payout
                    messages.append(f"{Colors.GREEN}✅ Won ${payout} on 3 or 11!{Colors.RESET}")
                else:
                    messages.append(f"{Colors.RED}❌ Lost ${amount} on {bet['type']}.{Colors.RESET}")
                
                self.active_bets['single_roll'] = {'type': 'none', 'amount': 0}
            
            # Process Pass Line bet
            if self.active_bets['pass_line'] > 0:
                if total in [7, 11]:
                    payout = self.active_bets['pass_line']
                    balance_change += payout
                    messages.append(f"{Colors.GREEN}✅ Won ${payout} on Pass Line!{Colors.RESET}")
                elif total in [2, 3, 12]:
                    messages.append(f"{Colors.RED}❌ Lost ${self.active_bets['pass_line']} on Pass Line.{Colors.RESET}")
                # Bet stays if point is established
            
            # Process Don't Pass bet
            if self.active_bets['dont_pass'] > 0:
                if total in [2, 3]:
                    payout = self.active_bets['dont_pass']
                    balance_change += payout
                    messages.append(f"{Colors.GREEN}✅ Won ${payout} on Don't Pass!{Colors.RESET}")
                elif total == 7:
                    messages.append(f"{Colors.RED}❌ Lost ${self.active_bets['dont_pass']} on Don't Pass.{Colors.RESET}")
                elif total == 12:
                    messages.append(f"{Colors.YELLOW}🤝 Push! Bet returned on 12.{Colors.RESET}")
                    self.player_balance += self.active_bets['dont_pass']
                # Bet stays if point is established
            
            self.player_balance += balance_change
            
            # Determine round outcome
            if total in [7, 11]:
                self.round_over = True
                self.point = None
                self.active_bets['pass_line'] = 0
                self.active_bets['dont_pass'] = 0
                self.print_status(
                    f"{Colors.GREEN}{Colors.BOLD}Rolled {total}. Natural! Round Over.{Colors.RESET}",
                    balance_change
                )
            elif total in [2, 3, 12]:
                self.round_over = True
                self.point = None
                self.active_bets['pass_line'] = 0
                self.active_bets['dont_pass'] = 0
                self.print_status(
                    f"{Colors.RED}{Colors.BOLD}Rolled {total}. Craps! Round Over.{Colors.RESET}",
                    balance_change
                )
            else:
                self.point = total
                self.round_over = False
                self.print_status(
                    f"{Colors.YELLOW}Rolled {total}. Point is {total}.{Colors.RESET}\n"
                    f"Roll again to hit your point or a 7 to lose.",
                    balance_change
                )
            
            if messages:
                for msg in messages:
                    print(msg)
            
            input(f"\n{Colors.CYAN}Press Enter to continue...{Colors.RESET}")
            
        else:
            # Point established roll
            Colors.clear()
            self.print_header()
            
            print(f"\n{Colors.MAGENTA}Point is {self.point}{Colors.RESET}")
            input(f"{Colors.CYAN}Press Enter to roll...{Colors.RESET}")
            
            roll1, roll2, total = self.roll_dice()
            DiceVisual.print_dice_pair(roll1, roll2)
            
            balance_change = 0
            messages = []
            
            # Process single-roll bets
            if self.active_bets['single_roll']['type'] != 'none':
                bet = self.active_bets['single_roll']
                amount = bet['amount']
                
                if bet['type'] == 'any-7' and total == 7:
                    payout = amount * 4
                    balance_change += payout
                    messages.append(f"{Colors.GREEN}✅ Won ${payout} on Any 7!{Colors.RESET}")
                elif bet['type'] == 'any-craps' and total in [2, 3, 12]:
                    payout = amount * 7
                    balance_change += payout
                    messages.append(f"{Colors.GREEN}✅ Won ${payout} on Any Craps!{Colors.RESET}")
                elif bet['type'] == 'two-or-twelve' and total in [2, 12]:
                    payout = amount * 30
                    balance_change += payout
                    messages.append(f"{Colors.GREEN}✅ Won ${payout} on 2 or 12!{Colors.RESET}")
                elif bet['type'] == 'three-or-eleven' and total in [3, 11]:
                    payout = amount * 15
                    balance_change += payout
                    messages.append(f"{Colors.GREEN}✅ Won ${payout} on 3 or 11!{Colors.RESET}")
                else:
                    messages.append(f"{Colors.RED}❌ Lost ${amount} on {bet['type']}.{Colors.RESET}")
                
                self.active_bets['single_roll'] = {'type': 'none', 'amount': 0}
            
            # Process Pass Line bet
            if self.active_bets['pass_line'] > 0:
                if total == self.point:
                    payout = self.active_bets['pass_line']
                    balance_change += payout
                    messages.append(f"{Colors.GREEN}✅ Won ${payout} on Pass Line!{Colors.RESET}")
                elif total == 7:
                    messages.append(f"{Colors.RED}❌ Lost ${self.active_bets['pass_line']} on Pass Line.{Colors.RESET}")
                # Bet cleared after round
            
            # Process Don't Pass bet
            if self.active_bets['dont_pass'] > 0:
                if total == 7:
                    payout = self.active_bets['dont_pass']
                    balance_change += payout
                    messages.append(f"{Colors.GREEN}✅ Won ${payout} on Don't Pass!{Colors.RESET}")
                elif total == self.point:
                    messages.append(f"{Colors.RED}❌ Lost ${self.active_bets['dont_pass']} on Don't Pass.{Colors.RESET}")
                # Bet cleared after round
            
            self.player_balance += balance_change
            
            # Determine round outcome
            if total == self.point:
                self.round_over = True
                self.point = None
                self.active_bets['pass_line'] = 0
                self.active_bets['dont_pass'] = 0
                self.print_status(
                    f"{Colors.GREEN}{Colors.BOLD}Rolled {total}. You hit your Point! Round Over.{Colors.RESET}",
                    balance_change
                )
            elif total == 7:
                self.round_over = True
                self.point = None
                self.active_bets['pass_line'] = 0
                self.active_bets['dont_pass'] = 0
                self.print_status(
                    f"{Colors.RED}{Colors.BOLD}Rolled {total}. Seven Out! Round Over.{Colors.RESET}",
                    balance_change
                )
            else:
                self.print_status(
                    f"{Colors.YELLOW}Rolled {total}. Point is {self.point}. Roll again.{Colors.RESET}",
                    balance_change
                )
            
            if messages:
                for msg in messages:
                    print(msg)
            
            input(f"\n{Colors.CYAN}Press Enter to continue...{Colors.RESET}")
    
    def reset_game(self):
        """Reset the game to initial state."""
        Colors.clear()
        self.point = None
        self.round_over = True
        self.player_balance = 1000
        self.active_bets = {
            'pass_line': 0,
            'dont_pass': 0,
            'single_roll': {'type': 'none', 'amount': 0}
        }
        self.last_roll = []
        print(f"\n{Colors.GREEN}✅ Game reset! Balance: ${self.player_balance}{Colors.RESET}")
        input(f"{Colors.CYAN}Press Enter to continue...{Colors.RESET}")
    
    def run(self):
        """Main game loop."""
        while True:
            Colors.clear()
            self.print_header()
            
            print(f"\n{Colors.CYAN}{Colors.BOLD}Main Menu{Colors.RESET}")
            print(f"\n  {Colors.MAGENTA}1{Colors.RESET}. Roll Dice")
            print(f"  {Colors.MAGENTA}2{Colors.RESET}. Place Bets")
            print(f"  {Colors.MAGENTA}3{Colors.RESET}. Reset Game")
            print(f"  {Colors.MAGENTA}4{Colors.RESET}. View Balance")
            print(f"  {Colors.MAGENTA}5{Colors.RESET}. Quit")
            
            choice = input(f"\n{Colors.YELLOW}Choose an option (1-5): {Colors.RESET}")
            
            if choice == '1':
                self.play_round()
            elif choice == '2':
                self.place_bets()
            elif choice == '3':
                self.reset_game()
            elif choice == '4':
                Colors.clear()
                self.print_header()
                print(f"\n{Colors.GREEN}Current Balance: ${self.player_balance}{Colors.RESET}")
                if self.point:
                    print(f"{Colors.MAGENTA}Active Point: {self.point}{Colors.RESET}")
                input(f"\n{Colors.CYAN}Press Enter to continue...{Colors.RESET}")
            elif choice == '5':
                Colors.clear()
                print(f"\n{Colors.CYAN}Thanks for playing! Goodbye!{Colors.RESET}\n")
                break
            else:
                print(f"\n{Colors.RED}❌ Invalid choice. Please select 1-5.{Colors.RESET}")
                input(f"{Colors.CYAN}Press Enter to continue...{Colors.RESET}")

if __name__ == "__main__":
    # Check for colored output support
    if os.name == 'nt':
        os.system('color')  # Enable ANSI colors on Windows
    
    game = CrapsGame()
    game.run()
