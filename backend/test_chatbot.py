from chatbot_service.chatbot import ChatbotService

def main():
    # Create chatbot instance
    chatbot = ChatbotService()
    
    # Initialize chatbot
    print("Initializing chatbot...")
    result = chatbot.initialize()
    print(result)
    
    # Test with a question
    question = "What is the onboarding process?"
    print(f"\nAsking: {question}")
    response = chatbot.get_response(question)
    print(f"Response: {response}")

if __name__ == "__main__":
    main() 