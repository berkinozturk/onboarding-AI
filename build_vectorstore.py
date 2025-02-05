import os
from dotenv import load_dotenv
from langchain_community.embeddings import JinaEmbeddings
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_community.document_loaders.pdf import PyPDFDirectoryLoader
from langchain_community.vectorstores import FAISS
from langchain.text_splitter  import RecursiveCharacterTextSplitter
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains import create_retrieval_chain
from IPython.display import display, Markdown
from langchain.chains import create_history_aware_retriever
from langchain_core.prompts import MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from langchain.retrievers import ContextualCompressionRetriever
from langchain.retrievers.document_compressors import LLMChainExtractor
from langchain.retrievers.document_compressors import LLMChainFilter
from langchain.retrievers.document_compressors import EmbeddingsFilter
from langchain.retrievers.document_compressors import DocumentCompressorPipeline
from langchain_community.document_transformers import EmbeddingsRedundantFilter
from langchain_text_splitters import CharacterTextSplitter
from langchain_experimental.text_splitter import SemanticChunker

llm_api_key = "sk-93ndl1ghjd8nm12oen5ks90nixcnrst83bgo2"
jina_api_key = "jina_bde393e3becc48898b8f0730ed2dced6KDw8AzX0eUTVBmQfEDjKMGj8kg96"

llm = ChatOpenAI(temperature=0, base_url="https://lm3.hs-ansbach.de/worker2/v1/", model="gpt-4-turbo-preview", api_key=llm_api_key, streaming=True)
embeddings = JinaEmbeddings(jina_api_key=jina_api_key, model_name='jina-embeddings-v2-base-en')

def build_vectorstore(filepath, chunking_strategy):
    pdf_loader = PyPDFDirectoryLoader(
        path=f'/Users/berkinozturk/Desktop/aitest/{filepath}', # Wählt die Unterordner der beim Methodenaufruf ausgewählten Rolle aus
        glob='**/*.pdf',  # Dieses Muster wählt alle PDFs im Verzeichnis aus
        silent_errors=False,
        load_hidden=False,
        recursive=True,  # Durchsucht rekursiv alle Unterordner
        extract_images=False  # Bilder extrahieren, falls benötigt
    )
    pdf_documents = pdf_loader.load()

    text_splitter = None

    # Führt die beim Methodenaufruf ausgewählte Chunking-Strategie aus
    if chunking_strategy == "charsplitter":
        text_splitter = CharacterTextSplitter(chunk_size=100, chunk_overlap=20)

    elif chunking_strategy == "recursivesplitter":
        text_splitter = RecursiveCharacterTextSplitter()

    elif chunking_strategy == "semanticsplitter":
        text_splitter = SemanticChunker(JinaEmbeddings(jina_api_key=jina_api_key, model_name='jina-embeddings-v2-base-en'))

    # Erstellt und speichert den Vektorstore ab
    documents = text_splitter.split_documents(pdf_documents)
    vectorstore = FAISS.from_documents(documents, embeddings)
    vectorstore.save_local(f"/Users/berkinozturk/Desktop/aitest/{filepath}/vector_index_{chunking_strategy}")
    print(f"Vector store for {filepath} with strategy {chunking_strategy} is saved\n")

# Erstellt einen Vektorstore für jede Rolle und Strategie
filepath_list = ["leb", "stu", "bed"]
chunking_strategy_list = ["recursivesplitter", "semanticsplitter"] # "charsplitter"-Strategie wurde aufgrund des Token-Kontextlimit ausgeschlossen

for filepath in filepath_list:
    for chunking_strategy in chunking_strategy_list:
        build_vectorstore(filepath=filepath, chunking_strategy=chunking_strategy)