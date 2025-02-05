from langchain_community.embeddings import JinaEmbeddings
from langchain_openai import ChatOpenAI
from langchain_community.vectorstores import FAISS
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.retrievers import ContextualCompressionRetriever
from langchain.retrievers.document_compressors import LLMChainFilter, EmbeddingsFilter
from langchain.retrievers.document_compressors import DocumentCompressorPipeline
from langchain_community.document_loaders.pdf import PyPDFDirectoryLoader
import os

class ChatbotService:
    def __init__(self, llm_api_key, jina_api_key):
        self.llm = ChatOpenAI(temperature=0, api_key=llm_api_key)
        self.embeddings = JinaEmbeddings(jina_api_key=jina_api_key)
        self.chat_history = []
        
    def build_vectorstore(self, pdf_directory):
        """Build vector store from PDF files"""
        loader = PyPDFDirectoryLoader(
            path=pdf_directory,
            glob='**/*.pdf',
            recursive=True
        )
        documents = loader.load()
        
        text_splitter = RecursiveCharacterTextSplitter()
        split_documents = text_splitter.split_documents(documents)
        
        vectorstore = FAISS.from_documents(split_documents, self.embeddings)
        return vectorstore
    
    def setup_retrieval_chain(self, vectorstore):
        """Setup the retrieval chain for question answering"""
        retriever = vectorstore.as_retriever(search_kwargs={"k": 5})
        
        # Setup compression pipeline
        context_filter = LLMChainFilter.from_llm(self.llm)
        similarity_filter = EmbeddingsFilter(embeddings=self.embeddings, similarity_threshold=0.8)
        pipeline_compressor = DocumentCompressorPipeline(
            transformers=[context_filter, similarity_filter]
        )
        
        compression_retriever = ContextualCompressionRetriever(
            base_compressor=pipeline_compressor,
            base_retriever=retriever
        )
        
        # Setup prompt template
        prompt = ChatPromptTemplate.from_messages([
            ("system", "Answer the user's questions based on the following content in a professional and concise way:\n\n{context}"),
            MessagesPlaceholder(variable_name="chat_history"),
            ("user", "{input}")
        ])
        
        # Create chain
        document_chain = create_stuff_documents_chain(self.llm, prompt)
        return create_retrieval_chain(compression_retriever, document_chain)
    
    def get_response(self, question, retrieval_chain):
        """Get response for user question"""
        response = retrieval_chain.invoke({
            "input": question,
            "chat_history": self.chat_history
        })
        
        if response and "answer" in response:
            self.chat_history.append({"role": "user", "content": question})
            self.chat_history.append({"role": "assistant", "content": response["answer"]})
            return response["answer"]
        
        return "I'm sorry, I couldn't find a relevant answer to your question." 