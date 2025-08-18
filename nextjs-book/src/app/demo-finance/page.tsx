"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PythonEditor from "@/components/PythonEditor";
import LogoMark from "@/components/LogoMark";
import { motion } from "framer-motion";

/*
  Finance-focused landing page with Stripe-inspired design:
  - Dark theme with green/emerald finance gradients
  - Interactive Python assignments for financial professionals
  - Pricing tailored for financial institutions and trading firms
*/

const examples = [
  {
    id: "basic",
    title: "Assignment: Portfolio analyzer",
    blurb: "Week 3 assignment: build a comprehensive portfolio management tool.",
    file: "portfolio_analysis.py",
    code: String.raw`# FinPython 101 - Assignment 3: Portfolio Analysis System
# Student: Alex Rodriguez | Due: Oct 15, 2024

def analyze_portfolio(holdings, market_data):
    """
    Comprehensive portfolio analysis for investment decisions.
    Teaches: financial calculations, risk metrics, performance analysis.
    """
    portfolio = {
        'total_value': 0,
        'positions': [],
        'risk_metrics': {},
        'performance': {}
    }
    
    # Calculate individual position metrics
    for symbol, shares in holdings.items():
        if symbol in market_data:
            current_price = market_data[symbol]['price']
            position_value = shares * current_price
            
            # Get historical data for calculations
            hist_data = market_data[symbol]['history']
            daily_returns = calculate_returns(hist_data)
            
            position = {
                'symbol': symbol,
                'shares': shares,
                'current_price': current_price,
                'position_value': position_value,
                'daily_volatility': calculate_volatility(daily_returns),
                'beta': market_data[symbol].get('beta', 1.0)
            }
            
            portfolio['positions'].append(position)
            portfolio['total_value'] += position_value
    
    # Calculate portfolio-level metrics
    portfolio_returns = []
    for position in portfolio['positions']:
        weight = position['position_value'] / portfolio['total_value']
        symbol = position['symbol']
        hist_returns = calculate_returns(market_data[symbol]['history'])
        
        # Weight the returns for portfolio calculation
        weighted_returns = [r * weight for r in hist_returns[-30:]]  # Last 30 days
        portfolio_returns.extend(weighted_returns)
    
    # Risk and performance metrics
    portfolio_volatility = calculate_volatility(portfolio_returns)
    sharpe_ratio = calculate_sharpe_ratio(portfolio_returns, risk_free_rate=0.02)
    
    portfolio['risk_metrics'] = {
        'portfolio_volatility': round(portfolio_volatility, 4),
        'sharpe_ratio': round(sharpe_ratio, 3),
        'value_at_risk_5': calculate_var(portfolio_returns, confidence=0.05)
    }
    
    # Performance analysis
    total_return = sum(portfolio_returns)
    portfolio['performance'] = {
        'total_return_30d': round(total_return, 4),
        'annualized_return': round(total_return * 12, 4),  # Approximate annualization
        'best_day': round(max(portfolio_returns), 4),
        'worst_day': round(min(portfolio_returns), 4)
    }
    
    return portfolio

def calculate_returns(price_history):
    """Calculate daily returns from price history."""
    returns = []
    for i in range(1, len(price_history)):
        daily_return = (price_history[i] - price_history[i-1]) / price_history[i-1]
        returns.append(daily_return)
    return returns

def calculate_volatility(returns):
    """Calculate volatility (standard deviation of returns)."""
    if not returns:
        return 0
    
    mean_return = sum(returns) / len(returns)
    variance = sum((r - mean_return) ** 2 for r in returns) / len(returns)
    return variance ** 0.5

def calculate_sharpe_ratio(returns, risk_free_rate):
    """Calculate Sharpe ratio for risk-adjusted returns."""
    if not returns:
        return 0
    
    excess_returns = [r - risk_free_rate/252 for r in returns]  # Daily risk-free rate
    mean_excess = sum(excess_returns) / len(excess_returns)
    volatility = calculate_volatility(excess_returns)
    
    return mean_excess / volatility if volatility > 0 else 0

def calculate_var(returns, confidence=0.05):
    """Calculate Value at Risk at given confidence level."""
    if not returns:
        return 0
    
    sorted_returns = sorted(returns)
    var_index = int(len(sorted_returns) * confidence)
    return round(sorted_returns[var_index], 4)

# Sample market data
market_data = {
    'AAPL': {
        'price': 185.50,
        'beta': 1.2,
        'history': [180, 182, 179, 185, 183, 187, 185.50]
    },
    'GOOGL': {
        'price': 2750.00,
        'beta': 1.1,
        'history': [2700, 2720, 2680, 2750, 2730, 2780, 2750]
    },
    'JPM': {
        'price': 147.25,
        'beta': 1.3,
        'history': [145, 148, 143, 147, 149, 146, 147.25]
    },
    'BND': {  # Bond ETF for diversification
        'price': 76.50,
        'beta': 0.1,
        'history': [76.2, 76.4, 76.1, 76.5, 76.3, 76.6, 76.50]
    }
}

# Sample portfolio holdings
holdings = {
    'AAPL': 100,
    'GOOGL': 50,
    'JPM': 150,
    'BND': 200
}

# Analyze the portfolio
result = analyze_portfolio(holdings, market_data)

print("💼 PORTFOLIO ANALYSIS REPORT")
print("=" * 50)
print(f"Total Portfolio Value: $\{result['total_value']:,.2f}")

print("\n📊 INDIVIDUAL POSITIONS:")
for position in result['positions']:
    weight = (position['position_value'] / result['total_value']) * 100
    print(f"  \{position['symbol']}: $\{position['position_value']:,.2f} (\{weight:.1f}%)")
    print(f"    Shares: \{position['shares']}, Price: $\{position['current_price']}")
    print(f"    Volatility: \{position['daily_volatility']:.3f}, Beta: \{position['beta']}")

print(f"\n⚡ RISK METRICS:")
print(f"  Portfolio Volatility: \{result['risk_metrics']['portfolio_volatility']:.3f}")
print(f"  Sharpe Ratio: \{result['risk_metrics']['sharpe_ratio']:.3f}")
print(f"  Value at Risk (5%): \{result['risk_metrics']['value_at_risk_5']:.3f}")

print(f"\n📈 PERFORMANCE (Last 30 Days):")
print(f"  Total Return: \{result['performance']['total_return_30d']:.2%}")
print(f"  Annualized Return: \{result['performance']['annualized_return']:.2%}")
print(f"  Best Day: +\{result['performance']['best_day']:.2%}")
print(f"  Worst Day: \{result['performance']['worst_day']:.2%}")

# Risk assessment
volatility = result['risk_metrics']['portfolio_volatility']
if volatility > 0.02:
    risk_level = "HIGH"
    recommendation = "Consider adding defensive assets"
elif volatility > 0.015:
    risk_level = "MODERATE"
    recommendation = "Well-balanced risk profile"
else:
    risk_level = "LOW" 
    recommendation = "Consider adding growth assets"

print(f"\n🎯 RISK ASSESSMENT: \{risk_level}")
print(f"Recommendation: \{recommendation}")`,
  },
  {
    id: "intermediate",
    title: "Assignment: Algorithmic trading bot",
    blurb: "Week 8 assignment: build an automated trading system with signals.",
    file: "trading_bot.py",
    code: String.raw`# FinPython 101 - Assignment 8: Algorithmic Trading Bot
# Student: Sarah Kim | Due: Nov 12, 2024

import json
from datetime import datetime, timedelta

class TradingBot:
    """
    Algorithmic trading system with multiple strategies.
    Demonstrates: algorithms, financial modeling, risk management, automation.
    """
    
    def __init__(self, initial_capital=100000):
        self.capital = initial_capital
        self.initial_capital = initial_capital
        self.positions = {}
        self.trade_history = []
        self.risk_per_trade = 0.02  # 2% risk per trade
        self.max_position_size = 0.1  # 10% max position size
        
        # Technical indicators state
        self.price_history = {}
        self.indicators = {}
    
    def add_price_data(self, symbol, price, volume=1000):
        """Add new price data for analysis."""
        if symbol not in self.price_history:
            self.price_history[symbol] = []
        
        self.price_history[symbol].append({
            'price': price,
            'volume': volume,
            'timestamp': datetime.now()
        })
        
        # Keep only last 50 data points for indicators
        if len(self.price_history[symbol]) > 50:
            self.price_history[symbol] = self.price_history[symbol][-50:]
        
        # Update technical indicators
        self.update_indicators(symbol)
    
    def update_indicators(self, symbol):
        """Calculate technical indicators for trading signals."""
        if symbol not in self.price_history or len(self.price_history[symbol]) < 20:
            return
        
        prices = [data['price'] for data in self.price_history[symbol]]
        
        # Simple Moving Averages
        sma_20 = sum(prices[-20:]) / 20
        sma_10 = sum(prices[-10:]) / 10 if len(prices) >= 10 else sma_20
        sma_5 = sum(prices[-5:]) / 5 if len(prices) >= 5 else sma_10
        
        # Exponential Moving Average (simplified)
        ema_12 = self.calculate_ema(prices, 12)
        
        # RSI (Relative Strength Index) - simplified calculation
        rsi = self.calculate_rsi(prices)
        
        # Bollinger Bands
        bb_upper, bb_lower = self.calculate_bollinger_bands(prices, sma_20)
        
        self.indicators[symbol] = {
            'sma_20': sma_20,
            'sma_10': sma_10,
            'sma_5': sma_5,
            'ema_12': ema_12,
            'rsi': rsi,
            'bb_upper': bb_upper,
            'bb_lower': bb_lower,
            'current_price': prices[-1]
        }
    
    def calculate_ema(self, prices, period):
        """Calculate Exponential Moving Average."""
        if len(prices) < period:
            return sum(prices) / len(prices)
        
        multiplier = 2 / (period + 1)
        ema = sum(prices[:period]) / period  # Start with SMA
        
        for price in prices[period:]:
            ema = (price * multiplier) + (ema * (1 - multiplier))
        
        return ema
    
    def calculate_rsi(self, prices, period=14):
        """Calculate Relative Strength Index."""
        if len(prices) < period + 1:
            return 50  # Neutral RSI
        
        gains = []
        losses = []
        
        for i in range(1, len(prices)):
            change = prices[i] - prices[i-1]
            if change > 0:
                gains.append(change)
                losses.append(0)
            else:
                gains.append(0)
                losses.append(abs(change))
        
        avg_gain = sum(gains[-period:]) / period
        avg_loss = sum(losses[-period:]) / period
        
        if avg_loss == 0:
            return 100
        
        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
        return rsi
    
    def calculate_bollinger_bands(self, prices, sma, std_dev=2):
        """Calculate Bollinger Bands."""
        if len(prices) < 20:
            return sma * 1.02, sma * 0.98  # Default 2% bands
        
        # Calculate standard deviation
        variance = sum((price - sma) ** 2 for price in prices[-20:]) / 20
        std = variance ** 0.5
        
        upper_band = sma + (std * std_dev)
        lower_band = sma - (std * std_dev)
        
        return upper_band, lower_band
    
    def generate_trading_signal(self, symbol):
        """Generate buy/sell/hold signals based on multiple indicators."""
        if symbol not in self.indicators:
            return 'HOLD', 'Insufficient data'
        
        indicators = self.indicators[symbol]
        signals = []
        
        # Moving Average Crossover Strategy
        if indicators['sma_5'] > indicators['sma_10'] > indicators['sma_20']:
            signals.append(('BUY', 'Bullish MA crossover'))
        elif indicators['sma_5'] < indicators['sma_10'] < indicators['sma_20']:
            signals.append(('SELL', 'Bearish MA crossover'))
        
        # RSI Strategy
        if indicators['rsi'] < 30:
            signals.append(('BUY', 'Oversold RSI'))
        elif indicators['rsi'] > 70:
            signals.append(('SELL', 'Overbought RSI'))
        
        # Bollinger Bands Strategy
        current_price = indicators['current_price']
        if current_price < indicators['bb_lower']:
            signals.append(('BUY', 'Price below lower Bollinger Band'))
        elif current_price > indicators['bb_upper']:
            signals.append(('SELL', 'Price above upper Bollinger Band'))
        
        # Combine signals
        buy_signals = [s for s in signals if s[0] == 'BUY']
        sell_signals = [s for s in signals if s[0] == 'SELL']
        
        if len(buy_signals) >= 2:
            return 'BUY', f"Multiple buy signals: {', '.join([s[1] for s in buy_signals])}"
        elif len(sell_signals) >= 2:
            return 'SELL', f"Multiple sell signals: {', '.join([s[1] for s in sell_signals])}"
        elif buy_signals:
            return 'BUY', buy_signals[0][1]
        elif sell_signals:
            return 'SELL', sell_signals[0][1]
        else:
            return 'HOLD', 'No clear signal'
    
    def execute_trade(self, symbol, signal, reason):
        """Execute trades based on signals with risk management."""
        if signal == 'HOLD':
            return
        
        current_price = self.indicators[symbol]['current_price']
        
        # Calculate position size based on risk management
        risk_amount = self.capital * self.risk_per_trade
        max_position_value = self.capital * self.max_position_size
        
        if signal == 'BUY':
            # Calculate shares to buy
            shares_by_risk = int(risk_amount / (current_price * 0.05))  # 5% stop loss
            shares_by_position = int(max_position_value / current_price)
            shares_to_buy = min(shares_by_risk, shares_by_position)
            
            if shares_to_buy > 0 and self.capital >= shares_to_buy * current_price:
                cost = shares_to_buy * current_price
                self.capital -= cost
                
                if symbol in self.positions:
                    self.positions[symbol] += shares_to_buy
                else:
                    self.positions[symbol] = shares_to_buy
                
                trade = {
                    'symbol': symbol,
                    'action': 'BUY',
                    'shares': shares_to_buy,
                    'price': current_price,
                    'value': cost,
                    'reason': reason,
                    'timestamp': datetime.now()
                }
                
                self.trade_history.append(trade)
                print(f"🟢 BUY \{shares_to_buy} shares of \{symbol} at $\{current_price:.2f}")
                print(f"   Reason: {reason}")
                print(f"   Cost: $\{cost:.2f}, Remaining capital: $\{self.capital:.2f}")
        
        elif signal == 'SELL' and symbol in self.positions and self.positions[symbol] > 0:
            shares_to_sell = self.positions[symbol]
            revenue = shares_to_sell * current_price
            self.capital += revenue
            self.positions[symbol] = 0
            
            trade = {
                'symbol': symbol,
                'action': 'SELL',
                'shares': shares_to_sell,
                'price': current_price,
                'value': revenue,
                'reason': reason,
                'timestamp': datetime.now()
            }
            
            self.trade_history.append(trade)
            print(f"🔴 SELL \{shares_to_sell} shares of \{symbol} at $\{current_price:.2f}")
            print(f"   Reason: {reason}")
            print(f"   Revenue: $\{revenue:.2f}, New capital: $\{self.capital:.2f}")
    
    def get_portfolio_value(self):
        """Calculate total portfolio value."""
        portfolio_value = self.capital
        
        for symbol, shares in self.positions.items():
            if shares > 0 and symbol in self.indicators:
                current_price = self.indicators[symbol]['current_price']
                portfolio_value += shares * current_price
        
        return portfolio_value
    
    def generate_performance_report(self):
        """Generate comprehensive performance report."""
        portfolio_value = self.get_portfolio_value()
        total_return = (portfolio_value - self.initial_capital) / self.initial_capital
        
        print("\\n📊 TRADING BOT PERFORMANCE REPORT")
        print("=" * 50)
        print(f"Initial Capital: $\{self.initial_capital:,.2f}")
        print(f"Current Portfolio Value: $\{portfolio_value:,.2f}")
        print(f"Total Return: {total_return:.2%}")
        print(f"Available Cash: $\{self.capital:,.2f}")
        
        print("\\n📈 CURRENT POSITIONS:")
        for symbol, shares in self.positions.items():
            if shares > 0:
                current_price = self.indicators[symbol]['current_price']
                position_value = shares * current_price
                print(f"  \{symbol}: \{shares} shares @ $\{current_price:.2f} = $\{position_value:,.2f}")
        
        print(f"\\n📋 TRADE HISTORY ({len(self.trade_history)} trades):")
        for trade in self.trade_history[-5:]:  # Show last 5 trades
            action_emoji = "🟢" if trade['action'] == 'BUY' else "🔴"
            print(f"  \{action_emoji} \{trade['action']} \{trade['shares']} \{trade['symbol']} @ $\{trade['price']:.2f}")

# Example usage - Simulate trading session
print("🤖 ALGORITHMIC TRADING BOT SIMULATION")
print("=" * 50)

bot = TradingBot(initial_capital=100000)

# Simulate market data for AAPL
print("\\n📊 Processing market data and generating signals...")

# Day 1-5: Upward trend
prices = [150, 152, 154, 151, 155, 158, 160, 157, 161, 165]
for i, price in enumerate(prices):
    bot.add_price_data('AAPL', price, volume=1000000 + i*10000)
    
    if i >= 5:  # Start trading after some history
        signal, reason = bot.generate_trading_signal('AAPL')
        print(f"\\nDay \\{i+1}: AAPL $\\{price} - Signal: \\{signal}")
        if signal != 'HOLD':
            print(f"  Reason: \\{reason}")
        bot.execute_trade('AAPL', signal, reason)

bot.generate_performance_report()

print("\\n🎓 ALGORITHMIC TRADING CONCEPTS LEARNED:")
print("• Technical indicator calculation (SMA, EMA, RSI, Bollinger Bands)")
print("• Multi-signal trading strategy development")
print("• Risk management and position sizing")
print("• Automated trade execution and portfolio tracking")
print("• Performance measurement and backtesting principles")`,
  },
  {
    id: "advanced",
    title: "Assignment: Risk management system",
    blurb: "Final project: build a comprehensive financial risk analytics platform.",
    file: "risk_management.py",
    code: String.raw`# FinPython 101 - Final Project: Financial Risk Management System
# Student: Michael Chen | Due: Dec 10, 2024

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json

class RiskManagementSystem:
    """
    Comprehensive financial risk management and analytics platform.
    Final project demonstrating: quantitative finance, statistical modeling,
    portfolio theory, and enterprise risk management.
    """
    
    def __init__(self):
        self.portfolios = {}
        self.market_data = {}
        self.risk_limits = {
            'max_portfolio_var': 0.05,  # 5% daily VaR limit
            'max_sector_concentration': 0.3,  # 30% max in any sector
            'max_single_position': 0.1,  # 10% max single position
            'min_sharpe_ratio': 1.0  # Minimum Sharpe ratio
        }
        self.generate_sample_data()
    
    def generate_sample_data(self):
        """Generate realistic market and portfolio data."""
        print("🏦 Generating financial market dataset...")
        
        # Create sample market data with correlations
        np.random.seed(42)
        
        symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'JPM', 'BAC', 'XOM', 'CVX', 'JNJ', 'PFE']
        sectors = {
            'AAPL': 'Technology', 'GOOGL': 'Technology', 'MSFT': 'Technology',
            'TSLA': 'Automotive', 'JPM': 'Financial', 'BAC': 'Financial',
            'XOM': 'Energy', 'CVX': 'Energy', 'JNJ': 'Healthcare', 'PFE': 'Healthcare'
        }
        
        # Generate correlated returns
        correlation_matrix = np.random.uniform(0.2, 0.8, (len(symbols), len(symbols)))
        np.fill_diagonal(correlation_matrix, 1.0)
        
        # Generate 252 days of returns (1 trading year)
        returns = np.random.multivariate_normal(
            mean=[0.0008] * len(symbols),  # ~20% annual return
            cov=correlation_matrix * 0.0004,  # ~20% annual volatility
            size=252
        )
        
        for i, symbol in enumerate(symbols):
            prices = [100]  # Starting price
            for daily_return in returns[:, i]:
                new_price = prices[-1] * (1 + daily_return)
                prices.append(new_price)
            
            self.market_data[symbol] = {
                'prices': prices,
                'returns': returns[:, i].tolist(),
                'sector': sectors[symbol],
                'current_price': prices[-1],
                'volatility': np.std(returns[:, i]) * np.sqrt(252),  # Annualized
                'beta': np.random.uniform(0.8, 1.5)
            }
        
        # Create sample portfolios
        self.portfolios = {
            'Growth_Fund': {
                'AAPL': 150000, 'GOOGL': 200000, 'MSFT': 175000, 'TSLA': 125000
            },
            'Balanced_Fund': {
                'AAPL': 100000, 'JPM': 150000, 'JNJ': 125000, 'XOM': 75000
            },
            'Sector_Rotation': {
                'GOOGL': 80000, 'JPM': 120000, 'XOM': 100000, 'PFE': 90000, 'TSLA': 60000
            }
        }
        
        print(f"✅ Generated data for {len(symbols)} securities and {len(self.portfolios)} portfolios")
    
    def calculate_portfolio_metrics(self, portfolio_name):
        """Calculate comprehensive risk metrics for a portfolio."""
        if portfolio_name not in self.portfolios:
            return None
        
        portfolio = self.portfolios[portfolio_name]
        total_value = sum(portfolio.values())
        
        # Portfolio composition
        weights = {symbol: value/total_value for symbol, value in portfolio.items()}
        
        # Calculate portfolio returns
        portfolio_returns = []
        for i in range(252):  # Daily returns for a year
            daily_return = 0
            for symbol, weight in weights.items():
                if symbol in self.market_data:
                    daily_return += weight * self.market_data[symbol]['returns'][i]
            portfolio_returns.append(daily_return)
        
        # Risk metrics
        portfolio_vol = np.std(portfolio_returns) * np.sqrt(252)  # Annualized
        portfolio_return = np.mean(portfolio_returns) * 252  # Annualized
        
        # Value at Risk (VaR) calculations
        var_95 = np.percentile(portfolio_returns, 5)  # 95% VaR
        var_99 = np.percentile(portfolio_returns, 1)  # 99% VaR
        
        # Expected Shortfall (Conditional VaR)
        es_95 = np.mean([r for r in portfolio_returns if r <= var_95])
        
        # Maximum Drawdown
        cumulative_returns = np.cumprod([1 + r for r in portfolio_returns])
        running_max = np.maximum.accumulate(cumulative_returns)
        drawdowns = (cumulative_returns - running_max) / running_max
        max_drawdown = np.min(drawdowns)
        
        # Sharpe Ratio (assuming 2% risk-free rate)
        sharpe_ratio = (portfolio_return - 0.02) / portfolio_vol
        
        # Sector concentration
        sector_exposure = {}
        for symbol, value in portfolio.items():
            sector = self.market_data[symbol]['sector']
            sector_exposure[sector] = sector_exposure.get(sector, 0) + value
        
        sector_concentrations = {sector: value/total_value for sector, value in sector_exposure.items()}
        max_sector_concentration = max(sector_concentrations.values())
        
        return {
            'portfolio_value': total_value,
            'weights': weights,
            'annual_return': portfolio_return,
            'annual_volatility': portfolio_vol,
            'sharpe_ratio': sharpe_ratio,
            'var_95_daily': var_95,
            'var_99_daily': var_99,
            'expected_shortfall_95': es_95,
            'max_drawdown': max_drawdown,
            'sector_concentrations': sector_concentrations,
            'max_sector_concentration': max_sector_concentration
        }
    
    def stress_testing(self, portfolio_name, scenarios):
        """Perform stress testing under various market scenarios."""
        portfolio = self.portfolios[portfolio_name]
        results = {}
        
        for scenario_name, shocks in scenarios.items():
            scenario_pnl = 0
            
            for symbol, position_value in portfolio.items():
                if symbol in shocks:
                    shock = shocks[symbol]
                    pnl = position_value * shock
                    scenario_pnl += pnl
            
            results[scenario_name] = {
                'total_pnl': scenario_pnl,
                'percentage_impact': scenario_pnl / sum(portfolio.values())
            }
        
        return results
    
    def risk_limit_monitoring(self, portfolio_name):
        """Monitor portfolio against established risk limits."""
        metrics = self.calculate_portfolio_metrics(portfolio_name)
        if not metrics:
            return {}
        
        violations = {}
        
        # Check VaR limit
        daily_var_95 = abs(metrics['var_95_daily'])
        if daily_var_95 > self.risk_limits['max_portfolio_var']:
            violations['VaR Limit'] = {
                'current': daily_var_95,
                'limit': self.risk_limits['max_portfolio_var'],
                'severity': 'HIGH'
            }
        
        # Check sector concentration
        if metrics['max_sector_concentration'] > self.risk_limits['max_sector_concentration']:
            violations['Sector Concentration'] = {
                'current': metrics['max_sector_concentration'],
                'limit': self.risk_limits['max_sector_concentration'],
                'severity': 'MEDIUM'
            }
        
        # Check single position limits
        max_position = max(metrics['weights'].values())
        if max_position > self.risk_limits['max_single_position']:
            violations['Position Size'] = {
                'current': max_position,
                'limit': self.risk_limits['max_single_position'],
                'severity': 'MEDIUM'
            }
        
        # Check Sharpe ratio
        if metrics['sharpe_ratio'] < self.risk_limits['min_sharpe_ratio']:
            violations['Sharpe Ratio'] = {
                'current': metrics['sharpe_ratio'],
                'limit': self.risk_limits['min_sharpe_ratio'],
                'severity': 'LOW'
            }
        
        return violations
    
    def generate_risk_report(self, portfolio_name):
        """Generate comprehensive risk management report."""
        print(f"\\n📊 RISK MANAGEMENT REPORT: {portfolio_name}")
        print("=" * 60)
        
        metrics = self.calculate_portfolio_metrics(portfolio_name)
        if not metrics:
            print("Portfolio not found")
            return
        
        # Portfolio overview
        print(f"Portfolio Value: $\\{metrics['portfolio_value']:,.2f}")
        print(f"Annual Return: {metrics['annual_return']:.2%}")
        print(f"Annual Volatility: {metrics['annual_volatility']:.2%}")
        print(f"Sharpe Ratio: {metrics['sharpe_ratio']:.3f}")
        
        # Risk metrics
        print(f"\\n⚡ RISK METRICS:")
        print(f"  95% VaR (Daily): {metrics['var_95_daily']:.3%}")
        print(f"  99% VaR (Daily): {metrics['var_99_daily']:.3%}")
        print(f"  Expected Shortfall (95%): {metrics['expected_shortfall_95']:.3%}")
        print(f"  Maximum Drawdown: {metrics['max_drawdown']:.3%}")
        
        # Sector exposure
        print(f"\\n🏭 SECTOR EXPOSURE:")
        for sector, concentration in metrics['sector_concentrations'].items():
            print(f"  {sector}: {concentration:.1%}")
        
        # Stress testing
        stress_scenarios = {
            'Market Crash': {'AAPL': -0.3, 'GOOGL': -0.35, 'MSFT': -0.25, 'TSLA': -0.4, 'JPM': -0.2},
            'Tech Selloff': {'AAPL': -0.2, 'GOOGL': -0.25, 'MSFT': -0.18, 'TSLA': -0.15},
            'Financial Crisis': {'JPM': -0.4, 'BAC': -0.45, 'AAPL': -0.1, 'GOOGL': -0.1},
            'Energy Shock': {'XOM': 0.3, 'CVX': 0.25, 'AAPL': -0.05, 'TSLA': -0.1}
        }
        
        stress_results = self.stress_testing(portfolio_name, stress_scenarios)
        print(f"\\n🔥 STRESS TEST RESULTS:")
        for scenario, result in stress_results.items():
            print(f"  \\{scenario}: $\\{result['total_pnl']:,.2f} (\\{result['percentage_impact']:.2%})")
        
        # Risk limit violations
        violations = self.risk_limit_monitoring(portfolio_name)
        if violations:
            print(f"\\n🚨 RISK LIMIT VIOLATIONS:")
            for violation_type, details in violations.items():
                severity_emoji = {"HIGH": "🔴", "MEDIUM": "🟡", "LOW": "🟠"}[details['severity']]
                print(f"  {severity_emoji} {violation_type}: {details['current']:.3f} (Limit: {details['limit']:.3f})")
        else:
            print(f"\\n✅ ALL RISK LIMITS WITHIN ACCEPTABLE RANGES")
        
        # Recommendations
        print(f"\\n💡 RISK MANAGEMENT RECOMMENDATIONS:")
        if metrics['max_sector_concentration'] > 0.4:
            print("  • Consider diversifying sector exposure")
        if metrics['sharpe_ratio'] < 1.0:
            print("  • Review portfolio construction for better risk-adjusted returns")
        if abs(metrics['var_95_daily']) > 0.03:
            print("  • Consider reducing portfolio volatility")
        if max(metrics['weights'].values()) > 0.15:
            print("  • Consider reducing concentration in largest positions")

# Initialize risk management system and run analysis
print("🏦 FINANCIAL RISK MANAGEMENT SYSTEM")
print("=" * 60)

risk_system = RiskManagementSystem()

# Analyze all portfolios
for portfolio_name in risk_system.portfolios.keys():
    risk_system.generate_risk_report(portfolio_name)

print("\\n✅ FINAL PROJECT DEMONSTRATES:")
print("• Advanced portfolio risk analytics and measurement")
print("• Value at Risk (VaR) and Expected Shortfall calculations")
print("• Stress testing and scenario analysis")
print("• Risk limit monitoring and compliance systems")
print("• Comprehensive financial risk management frameworks")
print("• Quantitative finance and statistical modeling")`,
  },
];

export default function LandingV2() {
  const [tab, setTab] = useState(0);
  const [auto, setAuto] = useState(false);

  useEffect(() => {
    if (!auto) return; const id = setInterval(() => setTab((t) => (t + 1) % examples.length), 7000);
    return () => clearInterval(id);
  }, [auto]);

  const active = examples[tab];

  return (
    <div className="min-h-screen bg-[#0A0B0E] text-white">
      {/* Layered finance aurora background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-32 h-[520px] w-[520px] rounded-full bg-[radial-gradient(closest-side,rgba(34,197,94,0.35),transparent)] blur-2xl" />
        <div className="absolute top-1/3 -right-24 h-[520px] w-[520px] rounded-full bg-[radial-gradient(closest-side,rgba(16,185,129,0.35),transparent)] blur-2xl" />
        <div className="absolute bottom-0 left-1/4 h-[420px] w-[420px] rounded-full bg-[radial-gradient(closest-side,rgba(5,150,105,0.25),transparent)] blur-2xl" />
        {/* Subtle grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:24px_24px] opacity-[0.08]" />
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0A0B0E]/70 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark className="h-6 w-6 text-white" variant="brackets" />
            <span className="text-sm font-semibold tracking-tight text-white/90">Interactive Coding: Financial Services</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex text-sm text-white/70">
            <Link href="#features" className="hover:text-white">Features</Link>
            <Link href="#examples" className="hover:text-white">Examples</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-full border border-white/15 px-4 py-1.5 text-sm text-white/90 hover:bg-white/5">Sign in</Link>
            <Link href="/register/organization" className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-black hover:bg-white/90">Get started</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Finance-themed gradient background */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(120%_80%_at_0%_0%,#22c55e_0%,transparent_60%),radial-gradient(120%_80%_at_100%_0%,#10b981_0%,transparent_60%),radial-gradient(120%_80%_at_50%_100%,#059669_0%,transparent_60%)] opacity-90" />
        <div className="mx-auto max-w-7xl px-4 py-16 md:py-24">
          <div className="grid items-center gap-10 md:grid-cols-2">
            {/* Left copy */}
            <div>
              <div className="mb-4 w-fit rounded-full border border-black/10 bg-white/80 px-3 py-1 text-[11px] font-semibold text-black/70 shadow-sm backdrop-blur">Trusted by Investment Banks & Trading Firms</div>
              <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl">
                <span className="block">Quantitative finance</span>
                <span className="block">training platform</span>
                <span className="bg-gradient-to-r from-green-300 via-emerald-300 to-teal-300 bg-clip-text text-transparent">for financial professionals</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg text-black/70">
                Train traders, analysts, and quants in Python programming, algorithmic trading, and risk management. From portfolio optimization to automated trading systems.
              </p>
              <div className="mt-8 flex items-center gap-3">
                <Link href="/register/organization" className="rounded-full bg-black px-6 py-2 text-sm font-semibold text-white hover:bg-black/90">Get started</Link>
                <Link href="/contact" className="rounded-full border border-black/10 bg-white/70 px-6 py-2 text-sm font-semibold text-black hover:bg-white/90 backdrop-blur">Contact sales</Link>
              </div>
            </div>

            {/* Right stacked product preview */}
            <div className="relative">
              {/* Back card (analytics) */}
              <div className="absolute -right-6 -top-6 hidden w-[340px] rotate-2 rounded-2xl border border-black/10 bg-white/80 p-4 shadow-2xl backdrop-blur md:block">
                <div className="text-sm font-semibold text-black">Portfolio Returns</div>
                <div className="mt-2 h-28 w-full">
                  {/* Finance metrics chart */}
                  <svg viewBox="0 0 300 100" className="h-full w-full">
                    <polyline fill="none" stroke="currentColor" strokeWidth="3" className="text-green-600" points="0,90 40,85 80,70 120,65 160,45 200,40 240,25 280,20" />
                  </svg>
                </div>
                <div className="mt-2 text-xs text-black/70">Alpha generation <span className="text-green-600 font-semibold">+15.2%</span></div>
              </div>

              {/* Front card (editor) */}
              <div className="rounded-2xl border border-black/10 bg-white/90 shadow-2xl backdrop-blur">
                <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
                  <div className="text-sm font-semibold text-black">Quantitative Analysis • Portfolio Risk</div>
                  <div className="text-xs text-black/60">Python</div>
                </div>
                <div className="h-[360px]">
                  <PythonEditor initialCode={examples[0].code} />
                </div>
              </div>
            </div>
          </div>

          {/* Financial institution marquee */}
          <div className="mt-12 overflow-hidden">
            <div className="mx-auto grid max-w-5xl grid-cols-2 items-center gap-6 opacity-70 sm:grid-cols-4">
              {["Goldman Sachs","Morgan Stanley","BlackRock","Citadel","Two Sigma","Renaissance"].map((n) => (
                <div key={n} className="flex h-10 items-center justify-center rounded-md border border-white/10 bg-white/5 text-xs tracking-wide text-white/70">{n}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Code examples */}
      <section id="examples" className="px-4">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-white/10 bg-black/40 p-2 shadow-2xl">
            {/* Tab bar */}
            <div className="relative flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1 text-sm">
              {/* Moving active background */}
              <motion.div
                layout
                className="absolute inset-y-1 left-1 rounded-lg bg-white/10"
                style={{ width: `${100 / examples.length}%` , translateX: `calc(${tab} * (100% + 4px))` }}
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
              {examples.map((e, i) => (
                <button
                  key={e.id}
                  onClick={() => setTab(i)}
                  className={`relative z-10 flex-1 rounded-lg px-3 py-2 text-left ${i===tab?"text-white":"text-white/70 hover:text-white"}`}
                >
                  <div className="text-[11px] uppercase tracking-wider">{e.file}</div>
                  <div className="text-[13px] font-medium">{e.title}</div>
                </button>
              ))}
            </div>

            {/* Panel */}
            <div className="mt-3 grid gap-3 md:grid-cols-[1.2fr,1fr]">
              <div className="rounded-xl border border-white/10 bg-[#0B0C11]">
                <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-xs text-white/60">
                  <div className="truncate">{active.blurb}</div>
                  <div className="flex items-center gap-1 text-[10px]">
                    <span className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5">python</span>
                    <span className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5">quant</span>
                  </div>
                </div>
                <div className="h-[460px] rounded-b-xl">
                  <PythonEditor initialCode={active.code} />
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0B0C11] p-4">
                <h3 className="text-sm font-semibold">Financial concepts covered</h3>
                <ul className="mt-2 space-y-2 text-sm text-white/70">
                  {tab===0 && (
                    <>
                      <li>• Portfolio risk metrics calculation</li>
                      <li>• Sharpe ratio and performance analysis</li>
                      <li>• Value at Risk (VaR) modeling</li>
                    </>
                  )}
                  {tab===1 && (
                    <>
                      <li>• Algorithmic trading strategies</li>
                      <li>• Technical indicator development</li>
                      <li>• Automated risk management</li>
                    </>
                  )}
                  {tab===2 && (
                    <>
                      <li>• Enterprise risk management</li>
                      <li>• Stress testing and scenarios</li>
                      <li>• Regulatory compliance monitoring</li>
                    </>
                  )}
                </ul>
                <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-white/70">
                  Financial professionals: these examples implement real quantitative finance models and trading strategies.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section id="features" className="px-4">
        <div className="mx-auto max-w-6xl py-16 md:py-20">
          <div className="grid gap-3 md:grid-cols-3">
            {[
              {h:"Quantitative modeling", p:"Train staff on portfolio optimization, risk metrics, and algorithmic trading strategies."},
              {h:"Trading system development", p:"Build automated trading bots, signal generation, and execution management systems."},
              {h:"Financial compliance", p:"SEC/FINRA compliant training with audit trails and regulatory reporting capabilities."},
            ].map((f) => (
              <div key={f.h} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-semibold">{f.h}</div>
                <p className="mt-1 text-sm text-white/70">{f.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Bottom CTA */}
      <section className="px-4">
        <div className="mx-auto max-w-5xl rounded-2xl border border-white/10 bg-gradient-to-r from-white/10 to-white/5 p-8 text-center">
          <h2 className="text-2xl font-semibold">Ready to optimize your trading edge?</h2>
          <p className="mt-2 text-white/70">Join leading financial institutions training the next generation of quantitative professionals. SEC/FINRA compliant with audit trail security.</p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/register/organization" className="rounded-full bg-white px-6 py-2 text-sm font-semibold text-black hover:bg-white/90">Start trading program</Link>
            <Link href="/contact" className="rounded-full border border-white/15 bg-white/5 px-6 py-2 text-sm font-semibold text-white hover:bg-white/10">Request demo</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-16 border-t border-white/10 px-4 py-10 text-center text-xs text-white/50">
        © {new Date().getFullYear()} Interactive Coding: Financial Services · Privacy · Terms · SEC/FINRA Compliance
      </footer>
    </div>
  );
}