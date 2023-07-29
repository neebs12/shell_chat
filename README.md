# Shell Chat
![Demo gif](https://github.com/neebs12/shell_chat/blob/main/demo-final.gif)

## Getting Started
```
$ npm i -g shell_chat
$ sc
```

## Requirements
To run this, it requires the following:
- `npm`
- `node >= 18.0.0`

## Core Features

This project is primarily driven by the aim to integrate certain user-friendly features absent in comparable applications. Key features include:

- **"Streaming" with Syntax Highlighting**: Output is somehwat "realtime" to the console while being able to retain syntax highlighting.
- [**Multiline Mode**](#multiline-mode): Allows input of more than one line.
- [**Chat Management**](#chat-management): Save, load, and delete past conversations.
- [**File Tracking during Chats**](#file-tracking-experimental): Stuff files in to your promp in the midst of chat sessions.
- [**Token Management**](#token-management): Change the limit of tokens sent to open AI to limit bills.

## Multiline mode

### Entering Multiline Mode with `\`
```
##> \
##> This is a message \
```

### Exiting Multiline Mode with `eof`
```
eof
```

## Chat management

### List and load existing chats

```
##> /ls
##> /l existing-chat
```

NOTE: Loading chats will render your whole conversation automatically

### Saving chat (or overwrite)

```
##> /s
##> /s save-to-a-new-name
##> /so save-to-an-existing-name
```

### Deleting chat (or all chats)

```
##> /d specific-chat
##> /delete-all
```

### Other commands
- Rename chat `/rn renaming-name`
- New chat `/n new-name`
- Resetting current chat `/rc` (removing conversation history)

### NOTE
- Chats are saved in `~/.cache/shell-chat.json`

## File tracking (Experimental)

Track files in the middle of chats. The app will automatically stuff the latest version of the tracked file in to the prompt before sending your message, thus allowing you to swap files in and out as needed for a specific conversation. **Tokens are automatically managed** and you shouldn't encounter OPEN AI errors.

The list of commands to utilize this feature are outlined below. [Glob patterns](https://www.malikbrowne.com/blog/a-beginners-guide-glob-patterns/) are utilized. File search occurs **from the depth of current working directory**.

### Find and track files
Find and track all files
```
##> /fa **
```

Advanced example: Track all `.rb` files under controller in addition to all files under the `views` flder EXCEPT for `.js.erb` files
```
##> /find-add controller/**/*.rb views/**/* !**/*.js.erb
OR (/fa)
```

Generally **better to confirm** that you are going to track the correct files via `/f` first
```
##> /find <glob-pattern/s>
OR (/f)
```

### Untrack files
```
##> /rf <glob-pattern/s>
```

### Reset All
Untracks all files and erases current conversation history for the current chat.
```
##> /ra
```

### Listing tracked files
This gives a detailed breakdown of which files are consuming which in addition to TOKENS REMAINING when deciding to track additional files
```
##> /tr
```

## Token management

Token managements is done for you automatically and you dont have to worry about it generally. The app will notify you if you have tracked too many files in addition to conversations being truncated AUTOMATICALLY when you go over your limit.

But if you want fine-grained control, see the following sections
### Token Report
Detailed breakdown of how tokens are being used. From system prompts, existing conversation history, to tracked files (if any).
```
##> /tr
```

### Limit Conversation History by tokens
You can truncate the conversation history that is sent in each messages to OpenAI by determining the maximum tokens that the conversation history occupy. If the provided value is greater than the model's max tokens, the app defers to the max tokens automatically.
```
##> /tl <token-number>
```

### Environment Variables
Environment Variables are stored in `~/.config/shell-chat/.env`. These are the contents

```shell
# MAIN ENVIRONMENT VARIABLES
OPENAI_API_KEY=...           # Open AI api key

MODEL_NAME=gpt-3.5-turbo-16k # change to gpt-4 if needed
MAX_TOKENS=16384             # adjust with model

MAX_COMPLETION_TOKENS=500    # Max tokens in AI reponse

# APP-SPECIFIC ENVIRONMENT VARIABLES
# Minimum amount of tokens available for conversation history
# ... when tracking large/numerous files
RESERVED_CONVERSATION_TOKENS=2000

RESERVED_ERROR_CORRECTION_TOKENS=200  # Buffer for potential miscalculation
RESERVED_INPUT_TOKENS=250             # no longer used
```
