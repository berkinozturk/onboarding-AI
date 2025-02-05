from langchain_community.embeddings import JinaEmbeddings
from langchain_openai import ChatOpenAI
from langchain_community.vectorstores import FAISS
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.retrievers import ContextualCompressionRetriever
from langchain.retrievers.document_compressors import LLMChainFilter
from langchain_community.document_loaders.pdf import PyPDFDirectoryLoader
import os
import sys
import traceback
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class ChatbotService:
    def __init__(self):
        api_key = os.getenv('LLM_API_KEY')
        if not api_key:
            raise ValueError("LLM_API_KEY environment variable is not set")
            
        self.llm = ChatOpenAI(
            temperature=0, 
            api_key=api_key,
            base_url="https://lm3.hs-ansbach.de/worker2/v1",
            model="deepseekl70b_chat"
        )
        self.embeddings = JinaEmbeddings(jina_api_key=os.getenv('JINA_API_KEY'))
        self.chat_history = []
        self.retrieval_chain = None
        self.initialize()
        
    def initialize(self):
        """Initialize the chatbot by building vectorstore and setting up chain"""
        try:
            print("Starting initialization...")
            vectorstore = self.build_vectorstore()
            print("Vector store built successfully")
            self.setup_retrieval_chain(vectorstore)
            print("Retrieval chain setup complete")
            print("Chatbot initialized successfully!")
        except Exception as e:
            print(f"Error during initialization: {str(e)}")
            traceback.print_exc()
            raise
    
    def build_vectorstore(self):
        """Build vector store from PDF files"""
        try:
            pdf_directory = os.path.join(os.getcwd(), 'data', 'pdf')
            print(f"Loading PDFs from: {pdf_directory}")
            
            if not os.path.exists(pdf_directory):
                raise Exception(f"PDF directory not found: {pdf_directory}")
                
            loader = PyPDFDirectoryLoader(
                path=pdf_directory,
                glob='**/*.pdf',
                recursive=True
            )
            documents = loader.load()
            
            if not documents:
                raise Exception(f"No PDF documents found in: {pdf_directory}")
                
            print(f"Loaded {len(documents)} documents")
            
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=100,
                chunk_overlap=20
            )
            split_documents = text_splitter.split_documents(documents)
            
            if not split_documents:
                raise Exception("No text content found in documents")
                
            print(f"Created {len(split_documents)} text chunks")
            
            vectorstore = FAISS.from_documents(split_documents, self.embeddings)
            return vectorstore
        except Exception as e:
            print(f"Error in build_vectorstore: {str(e)}")
            traceback.print_exc()
            raise
    
    def setup_retrieval_chain(self, vectorstore):
        """Setup the retrieval chain for question answering"""
        try:
            retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
            
            # Sadece LLM filtresini kullan
            context_filter = LLMChainFilter.from_llm(self.llm)
            
            compression_retriever = ContextualCompressionRetriever(
                base_compressor=context_filter,
                base_retriever=retriever
            )
            
            # Setup prompt template with clear instructions
            prompt = ChatPromptTemplate.from_messages([
                ("system", """You are a helpful onboarding assistant for Skilled GmbH. Your responses should be:
                - Direct and concise
                - Professional and friendly
                - Based only on the provided context
                - Without revealing your internal thought process
                - Without repeating user messages
                
                Context for answering:
                {context}"""),
                MessagesPlaceholder(variable_name="chat_history"),
                ("user", "{input}")
            ])
            
            # Create chain
            document_chain = create_stuff_documents_chain(self.llm, prompt)
            self.retrieval_chain = create_retrieval_chain(compression_retriever, document_chain)
            
        except Exception as e:
            print(f"Error in setup_retrieval_chain: {str(e)}")
            traceback.print_exc()
            raise
    
    def get_response(self, question):
        """Get response for user question"""
        if not self.retrieval_chain:
            return "Error: Chatbot not initialized. Please initialize first."
            
        try:
            response = self.retrieval_chain.invoke({
                "input": question,
                "chat_history": self.chat_history
            })
            
            if response and "answer" in response:
                # Clean up the response
                answer = response["answer"].strip()
                # Remove any internal thought process markers
                answer = answer.split("```")[0].strip()  # Remove code blocks if any
                answer = answer.split("'''")[0].strip()  # Remove alternative code blocks
                # Remove any text that looks like internal dialogue
                answer = answer.split("I should")[0].strip()
                answer = answer.split("The user is")[0].strip()
                
                self.chat_history.append({"role": "user", "content": question})
                self.chat_history.append({"role": "assistant", "content": answer})
                return answer
            
            return "I'm sorry, I couldn't find a relevant answer to your question."
        except Exception as e:
            error_msg = f"Error getting response: {str(e)}"
            print(error_msg)
            traceback.print_exc()
            return error_msg

def main():
    chatbot = None
    
    try:
        chatbot = ChatbotService()
        
        while True:
            try:
                question = input().strip()
                if not question:
                    continue
                    
                response = chatbot.get_response(question)
                print(response)
                sys.stdout.flush()
                    
            except EOFError:
                break
            except Exception as e:
                print(f"Error processing question: {str(e)}")
                traceback.print_exc()
                sys.stdout.flush()
                
    except Exception as e:
        print(f"Fatal error: {str(e)}")
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main() 