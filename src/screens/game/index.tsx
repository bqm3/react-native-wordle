
import { useEffect, useRef } from 'react';
import AnimatedLottieView from 'lottie-react-native';
import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '../../hooks/storeHooks';
import {
  setCurrentGuessIndex,
  setGameWon,
  setSolution,
  setGuesses,
  setUsedKeys,
  setGameEnded,
  setWrongGuessShake,
  setGameStarted,
  setGameLanguage,
} from '../../store/slices/gameStateSlice';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { guess, matchStatus } from '../../types';
import { HEIGHT, initialGuesses, SIZE } from '../../utils/constants';
import { getStoreData } from '../../utils/localStorageFuncs';
import { answersEN, wordsEN } from '../../words';
import GameBoard from './components/gameBoard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePlayManager } from '../../hooks/usePlayManager';
import { TabParamList } from '../../navigation/types';

type NavigationProp = BottomTabNavigationProp<TabParamList, 'Game'>; // hoặc 'Buy Coins' tùy màn hình

export default function Game({ navigation }: { navigation: NavigationProp }) {
  const {
    guesses,
    usedKeys,
    currentGuessIndex,
    gameStarted,
    gameEnded,
    gameWon,
    solution,
    gameLanguage,
  } = useAppSelector((state) => state.gameState);
  const dispatch = useAppDispatch();
  const { plays, loading } = usePlayManager();
  const lottieRef = useRef<AnimatedLottieView>(null);

  (async () => {
    const gameLanguage = (await getStoreData('language')) || 'en';
    dispatch(setGameLanguage(gameLanguage));
  })();

  const wordList = () => {
    switch (gameLanguage) {
      case 'en':
        return wordsEN.concat(answersEN);
      default:
        return wordsEN.concat(answersEN);
    }
  };

  const answers = (): string[] => {
    switch (gameLanguage) {
      case 'en':
        return answersEN;
      default:
        return answersEN;
    }
  };

  const handleFoundKeysOnKeyboard = (guess: guess) => {
    const tempUsedKeys = { ...usedKeys };

    guess.letters.forEach((letter: string, idx: number) => {
      const match = guess.matches?.[idx];
      if (!match) return;

      const keyValue = tempUsedKeys[letter];

      if (!keyValue) {
        tempUsedKeys[letter] = match;
      } else if (match === 'correct') {
        tempUsedKeys[letter] = 'correct';
      } else if (keyValue !== 'correct' && match === 'present') {
        tempUsedKeys[letter] = 'present';
      }
    });

    dispatch(setUsedKeys(tempUsedKeys));
  };

  const checkGameEnd = () => {
    const attemptsCount = guesses.filter((guess: guess) => {
      return guess.isComplete;
    }).length;
    if (attemptsCount === 6) {
      dispatch(setGameEnded(true));
    }
  };

  useEffect(() => {
    checkGameEnd();
  }, [currentGuessIndex]);

  const updateGuess = (keyPressed: string, currentGuess: guess) => {
    const currentGuessLetters = [...currentGuess.letters];
    let nextEmptyIndex = currentGuessLetters.findIndex(
      (letter) => letter === ''
    );
    if (nextEmptyIndex === -1) nextEmptyIndex = 5;
    const lastNonEmptyIndex = nextEmptyIndex - 1;
    if (keyPressed !== '<' && keyPressed !== 'Enter' && nextEmptyIndex < 5) {
      currentGuessLetters[nextEmptyIndex] = keyPressed;
      const updatedGuess = { ...currentGuess, letters: currentGuessLetters };
      const updatedGuesses = guesses.map((guess, idx) => {
        if (idx === currentGuessIndex) return updatedGuess;
        else return guess;
      });
      dispatch(setGuesses([...updatedGuesses]));
    } else if (keyPressed === '<') {
      currentGuessLetters[lastNonEmptyIndex] = '';
      const updatedGuess = { ...currentGuess, letters: currentGuessLetters };
      const updatedGuesses = guesses.map((guess, idx) => {
        if (idx === currentGuessIndex) return updatedGuess;
        else return guess;
      });
      dispatch(setGuesses([...updatedGuesses]));
    }
  };

  const checkGuess = (currentGuess: guess) => {
    const currentGuessedWord = currentGuess.letters.join('');
    if (currentGuessedWord.length === 5) {
      const isValidWord = true || wordList().includes(currentGuessedWord);
      if (isValidWord) {
        const matches: matchStatus[] = Array(5).fill('absent');
        const solutionLetters = solution.split('');
        const guessLetters = currentGuessedWord.split('');

        const solutionLetterCount: Record<string, number> = {};
        solutionLetters.forEach((char) => {
          solutionLetterCount[char] = (solutionLetterCount[char] || 0) + 1;
        });

        guessLetters.forEach((char: any, i) => {
          if (char === solutionLetters[i]) {
            matches[i] = 'correct';
            solutionLetterCount[char] = (solutionLetterCount[char] ?? 0) - 1;
          }
        });

        guessLetters.forEach((char, i) => {
          if (matches[i] === 'correct') return;
          if ((solutionLetterCount[char] ?? 0) > 0) {
            matches[i] = 'present';
            solutionLetterCount[char] = (solutionLetterCount[char] ?? 0) - 1;
          }
        });

        const updatedGuess = {
          ...currentGuess,
          matches,
          isComplete: true,
          isCorrect: currentGuessedWord === solution,
        };

        const updatedGuesses = guesses.map((guess, idx) =>
          idx === currentGuessIndex ? updatedGuess : guess
        );

        console.log('Updating guesses:', updatedGuesses);
        console.log('Advancing to next row, new index:', currentGuessIndex + 1);
        dispatch(setGuesses(updatedGuesses));
        dispatch(setCurrentGuessIndex(currentGuessIndex + 1));
        handleFoundKeysOnKeyboard(updatedGuess);

        if (currentGuessedWord === solution) {
          setTimeout(() => {
            lottieRef.current?.play();
            dispatch(setGameWon(true));
            dispatch(setGameEnded(true));
          }, 250 * 6);
        }
      } else {
        console.log('Invalid word:', currentGuessedWord);
        dispatch(setWrongGuessShake(true));
        setTimeout(() => {
          dispatch(setWrongGuessShake(false));
        }, 1000);
      }
    } else {
      console.log('Guess too short:', currentGuessedWord);
    }
  };

  const handleGuess = (keyPressed: string) => {
    if (!gameStarted) return; // Prevent handling guesses if game hasn't started
    if (!gameEnded) {
      const currentGuess = guesses[currentGuessIndex];
      if (currentGuess) {
        console.log(
          'Handling key:',
          keyPressed,
          'Current guess:',
          currentGuess
        );
        if (keyPressed !== 'Enter' && !currentGuess.isComplete) {
          updateGuess(keyPressed, currentGuess);
        } else if (keyPressed === 'Enter' && !gameWon) {
          checkGuess(currentGuess);
        }
      }
    }
  };

  const resetGameState = () => {
    dispatch(setGuesses([...initialGuesses]));
  };

  const resetGame = async () => {
    lottieRef.current?.reset();
    dispatch(setGameStarted(true));
    resetGameState();
    dispatch(setCurrentGuessIndex(0));
    dispatch(setUsedKeys([]));
    dispatch(setGameWon(false));
    dispatch(setGameEnded(false));
    dispatch(
      setSolution(answers()[Math.floor(Math.random() * answers().length)])
    );
    try {
      await reducePlay(); // Deduct a play
      console.log('Play count reduced successfully');
    } catch (error) {
      console.error('Error reducing play count:', error);
    }
  };

  const reducePlay = async () => {
    const current = parseInt((await AsyncStorage.getItem('plays')) || '0');
    const updated = Math.max(0, current - 1); // Prevent negative plays
    await AsyncStorage.setItem('plays', updated.toString());
  };

  if (loading) {
    return (
      <View style={styles.newGameScreen}>
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  if (!gameStarted) {
    return (
      <View style={styles.newGameScreen}>
        {plays > 0 ? (
          <TouchableOpacity onPress={resetGame}>
            <Text style={{ color: 'white', fontSize: 20 }}>Start a new game</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => navigation?.navigate('BuyCoins')}>
            <Text style={{ color: 'red', fontSize: 20 }}>
              You have to buy more play
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  console.log('solution', solution);
  return (
    <View style={{ position: 'relative' }}>
      <GameBoard
        solution={solution}
        handleGuess={handleGuess}
        resetGame={resetGame}
      />
      <AnimatedLottieView
        ref={lottieRef}
        style={styles.lottieContainer}
        source={require('../../lottie/confetti.json')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  lottieContainer: {
    width: SIZE,
    height: HEIGHT * 0.4,
    backgroundColor: 'transparent',
    position: 'absolute',
    zIndex: 10,
    top: 20,
  },
  newGameScreen: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
});