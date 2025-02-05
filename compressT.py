import os
# from dotenv import load_dotenv
# from langchain_community.embeddings import JinaEmbeddings
from langchain.embeddings import JinaEmbeddings
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_community.document_loaders.pdf import PyPDFDirectoryLoader
from langchain_community.vectorstores import FAISS
from langchain.text_splitter import RecursiveCharacterTextSplitter
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
# from langchain_together import TogetherEmbeddings
from langchain_community.llms import Together
from langchain_text_splitters import CharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
import datetime
import streamlit as st
from chat_history import chat_history, add_to_history, get_history

# Setzen der Streamlit-Seitenkonfiguration mit einem spezifischen Titel
st.set_page_config(page_title="StudAID")

# API-Schlüssel für verschiedene Dienste
llm_api_key = "sk-93ndl1ghjd8nm12oen5ks90nixcnrst83bgo2"
jina_api_key = "jina_85e88b5a92a94dd6a13483d4a5d5adebUThJASfAqbX_KUWS4_j-aL7riyoC"


# Definition einer Funktion, um Dokumente übersichtlich zu drucken
def pretty_print_docs(docs):
    print(
        f"\n{'-' * 100}\n".join(
            [f"Document {i + 1}:\n\n" + d.page_content for i, d in enumerate(docs)]
        )
    )


# Erzeugen von Embeddings mittels Jina für semantische Suche
embeddings = JinaEmbeddings(jina_api_key=jina_api_key, model_name='jina-embeddings-v2-base-en')

# Konfiguration eines Chat Language Models zur Generierung von Text
llm = ChatOpenAI(base_url="https://lm3.hs-ansbach.de/worker2/v1/", temperature=0, model='qwen15_72b',
                 api_key=llm_api_key)

# st.title("StudAID: Hier wird Ihnen geholfen!")

# st.image("/home/tamer/studaid/shared/logo.png", width=150,)

# Anpassung der Streamlit-Frontend-Styling-Optionen
st.markdown(
    """
    <style>
    .main {
        background: linear-gradient(135deg, #044f48, #2a7561);
        background-size: cover;
        font-family: 'Open Sans', sans-serif;
        font-size: 12px;
        line-height: 1.3;
        overflow: hidden;
        z-index: 1;
        overflow-y: scroll;
    }
    .bg {
        position: fixed;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
        z-index: -1;
        background: url('https://www.hs-ansbach.de/fileadmin/_processed_/c/f/csm_Aussenansicht_50_2_sky-barb_aa3bffdf8a.jpg') no-repeat center center;
        background-size: cover;
        filter: blur(40px);
        transform: scale(1.2);
    }

    h1 {
        text-shadow: 1px 1px 2px rgba(0,0,0,1);
        color: #fff;
        letter-spacing: 1px;
        text-transform: uppercase;
        text-align: center;
    }

    h2 {
        text-shadow: 1px 1px 2px rgba(0,0,0,1);
        color: #fff;
        letter-spacing: 1px;
        text-transform: uppercase;
        text-align: center;
    }

    .chat-container {
        background-color: rgba(0, 0, 0, 0.4);
        border-radius: 25px;
        box-shadow: 0px 0px 10px 5px rgba(0,0,0,0.7);
        overflow: hidden;
        padding: 15px;
        position: relative;
        width: 100%;
        max-width: 700px;
        min-width: 250px;
        margin: 0 auto;
        max-height: 500px;
        overflow-y: scroll;
        padding: 10px;

    }


    .stButton button {
        background-color: #4CAF50;
        color: white;
        padding: 10px 24px;
        font-size: 16px;
        margin: 10px 2px;
        cursor: pointer;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.35);
        border: none;
    }
    .stButton {
        margin-top: 40px;
    }
    .stButton button:hover {
        background-color: #45a049;
    }
    div[role="radiogroup"] {
        margin-top: -20px;
    }
    input#text_input_1 {
        border-radius: 1px;
        border: solid;
        box-shadow: 0 2px 10px rgba(0,0,0,0.35);
    }
    .chat-bubble {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
    }


    .chat-bubble.bot {
        flex-direction: row;  
        margin-left: 52px;
    }


    .chat-bubble.user {
        flex-direction: row-reverse;  
        margin-right: -58px;
    }

    .chat-avatar {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background-size: cover;
        background-position: center;
        margin: 0 10px; 
    }

    .chat-bubble-content {
        max-width: 60%;
        padding: 10px;
        border-radius: 10px;
        border: 1px solid #ccc;
        box-shadow: 0 2px 10px rgba(0,0,0,0.35);
    }


    .chat-bubble.user .chat-bubble-content {
        background-color: #DCF8C6;
        text-align: right;
    }

    .chat-bubble.bot .chat-bubble-content {
        background-color: #EDEDED;
        text-align: left;
    }

    body {
        overflow-y: scroll; 
    }





    </style>
    <div class="bg"></div>
    """,
    unsafe_allow_html=True
)

# Untertitel und Radiobuttons zur Auswahl der Nutzerrolle
col1, col2, col3 = st.columns([3, 4, 1])

with col1:
    st.markdown("<br>", unsafe_allow_html=True)
    genre = st.radio(
        "*** ***",
        ["Student", "Lehrbeauftragter", "Bediensteter"],
        index=0,
        horizontal=False
    )

with col2:
    st.image("/root/StudAid/shared/logo.png", width=200)
    # st.write("")

with col3:
    st.image("/root/StudAid/shared/hs-logo.png", width=100)

col1, col2, col3 = st.columns([4, 1, 1])

with col1:
    st.markdown(
        """
    
        <div class="chat-bubble bot">
            <div class="chat-avatar" style="background-image: url('https://icons.iconarchive.com/icons/iconarchive/robot-avatar/128/Blue-2-Robot-Avatar-icon.png');"></div>
            <div class="chat-bubble-content">
                Hallo! <br>Ich bin StudAID! <br>Wie kann ich helfen?
            </div>
        </div>
        """,
        unsafe_allow_html=True
    )

with col2:
    st.write("")

with col3:
    st.write("")

# st.subheader("Was ist deine Nutzerrolle?")
# st.subheader("Bitte geben Sie Ihre Frage ein und drücken Sie auf 'Senden'.")

# Logik zur Bestimmung des richtigen Vektor-Speichers abhängig von der Benutzerrolle
vectorstoreLabel = ""

if genre == 'Student':
    vectorstoreLabel = 'stu'
elif genre == 'Lehrbeauftragter':
    vectorstoreLabel = 'leb'
elif genre == 'Bediensteter':
    vectorstoreLabel = 'bed'

vectorstorePath = f"/root/StudAid/shared/vectorstores20240602/{vectorstoreLabel}/vector_index_recursivesplitter"

# Laden des entsprechenden Vektor-Speichers
vectorstore = FAISS.load_local(vectorstorePath, embeddings, allow_dangerous_deserialization=True)

# Erstellen von Retrieval- und Kompressionsfiltern
retriever = vectorstore.as_retriever(search_kwargs={"k": 5})

context_compression_filter = LLMChainFilter.from_llm(llm)
similarity_filter = EmbeddingsFilter(embeddings=embeddings, similarity_threshold=0.8)
pipeline_compressor = DocumentCompressorPipeline(
    transformers=[context_compression_filter, similarity_filter]
)

compression_retriever = ContextualCompressionRetriever(
    base_compressor=pipeline_compressor, base_retriever=retriever
)

# Vorlagen für Chat-Prompts zur Interaktion mit Benutzern
prompt = ChatPromptTemplate.from_messages([
    ("system",
     "As a First Level Supporter in a university, answer the user's questions based on the following content in a short, professional, and structured way with bullet points. The bulletpoints should be in this format ●. Answer in the same language as the query:\n\n{context}"),
    MessagesPlaceholder(variable_name="chat_history"),
    ("user", "{input}")
])

# Erstellen von Retrieval-Ketten zur Dokumentenbearbeitung
retrieval_chain = create_history_aware_retriever(llm, compression_retriever, prompt)

document_chain = create_stuff_documents_chain(llm, prompt)
conversational_retrieval_chain = create_retrieval_chain(retrieval_chain, document_chain)


# Dialog-Funktion, die auf Benutzereingaben reagiert
def dialog(user_input):
    # Implementierung des Streaming von Daten
    def streamData():
        try:
            for chunk in conversational_retrieval_chain.stream({
                'chat_history': get_history(),
                "input": user_input,
                "context": compressed_docs
            }):
                if answer_chunk := chunk.get("answer"):
                    yield answer_chunk
                    print(f"{answer_chunk}|", end="")  # Streaming-Antwort in der Konsole
        except:
            print("Es wurden keine Dokumente gefunden, Ihr Anliegen wird an den 2nd Level Support weitergeleitet.")
            st.divider()
            st.write(
                "\n\n\nEs wurden keine Dokumente gefunden, Ihr Anliegen wird an den 2nd Level Support weitergeleitet.")

    # Logik zur Verarbeitung von Benutzereingaben und Anzeigen der Antworten
    if len(user_input) > 0:
        chat_history = get_history()
        print(datetime.datetime.now(), "Chainaufruf in While vor compr")
        compressed_docs = []
        try:
            compressed_docs = compression_retriever.invoke(user_input)
        except:
            print("Keine Dokumente gefunden NACH dem Filter")

        print(datetime.datetime.now(), "Chainaufruf in While nach compr")
        # docs_with_scores = vectorstore.similarity_search_with_score(user_input)
        # print(datetime.datetime.now(),"Zeitstempel nach retrieval mit score")

        # for doc, score in docs_with_scores:
        #    print(f"Scores VOR Filter: {score} (ACHTUNG: HIERMIT IST DIE DISTANZ DER ÄHNLICHKEIT GEMEINT --> JE NIEDRIGER, DESTO ÄHNLICHER)")

        if compressed_docs is not None:
            col1, col2 = st.columns([6, 1])

            with col1:
                bubble_html = f"""
                <div class="chat-bubble user">
                    <div class="chat-avatar" style="background-image: url('https://icons.iconarchive.com/icons/hopstarter/sleek-xp-basic/128/Office-Girl-icon.png');"></div>
                    <div class="chat-bubble-content">
                        {user_input}
                    </div>
                </div>
                """

                if len(chat_history) > 0:
                    for i in range(0, len(chat_history), 2):
                        st.write(
                            f"""
                            <div class="chat-bubble user">
                                <div class="chat-avatar" style="background-image: url('https://icons.iconarchive.com/icons/hopstarter/sleek-xp-basic/128/Office-Girl-icon.png');"></div>
                                <div class="chat-bubble-content">
                                    {chat_history[i].content}
                                </div>
                            </div>
                            """, unsafe_allow_html=True
                        )
                        st.write(
                            f"""
                            <div class="chat-bubble bot">
                                <div class="chat-avatar" style="background-image: url('https://icons.iconarchive.com/icons/iconarchive/robot-avatar/128/Blue-2-Robot-Avatar-icon.png');"></div>
                                <div class="chat-bubble-content">
                                    {chat_history[i + 1].content.replace("<br>")}
                                </div>
                            </div>
                            """, unsafe_allow_html=True
                        )
                    st.write(
                        f"""
                        <div class="chat-bubble user">
                            <div class="chat-avatar" style="background-image: url('https://icons.iconarchive.com/icons/hopstarter/sleek-xp-basic/128/Office-Girl-icon.png');"></div>
                            <div class="chat-bubble-content">
                                {user_input}
                            </div>
                        </div>
                        """, unsafe_allow_html=True
                    )
                else:
                    st.write(bubble_html, unsafe_allow_html=True)

                # Streamen der Daten
                stream_data_placeholder = st.empty()

                stream_data_output = ""
                for chunk in streamData():
                    stream_data_output += chunk
                    stream_data_placeholder.write(
                        f"""
                        <div class="chat-bubble bot">
                            <div class="chat-avatar" style="background-image: url('https://icons.iconarchive.com/icons/iconarchive/robot-avatar/128/Blue-2-Robot-Avatar-icon.png');"></div>
                            <div class="chat-bubble-content">
                                {stream_data_output.replace("n", "<br>")}
                            </div>
                        </div>
                        """, unsafe_allow_html=True
                    )

                # response = None
                # if len(compressed_docs) > 0:
                #    response = conversational_retrieval_chain.invoke({
                #        'chat_history': chat_history,
                #        "input": user_input,
                #        "context": compressed_docs
                #        })
                #    print(datetime.datetime.now(),"Chainaufruf in While nach response")

                # Nachricht zur Chat-History hinzufügen
                if stream_data_output is not None:
                    add_to_history(HumanMessage(content=user_input))

                    # Antwort anzeigen und zur Chat-History hinzufügen
                    print("Anzahl gefundener Dokumente:")
                    print(len(compressed_docs))

                    print("________________________________________________________________________________________")
                    print("Deine Frage: ", user_input)
                    print("Meine Antwort:", stream_data_output)
                    print("________________________________________________________________________________________")
                    add_to_history(AIMessage(content=stream_data_output))
                    print("CHAT HISTORY", chat_history)
                    # st.divider()
                    # for i, doc in enumerate(compressed_docs):
                    #    st.text(f"Dokument {i+1}")
                    #    st.markdown(doc.page_content)
                    #    st.divider()
            with col2:
                st.write("")
                # with col3:
            #     st.write("")


# Erzeugen der Benutzeroberfläche für Eingabe und Absenden von Anfragen
col1, col2, col3 = st.columns([1, 4, 1])
with col1:
    st.write("")

with col2:
    user_input = st.text_area(label="Geben Sie hier Ihre Frage ein...", placeholder="Geben Sie hier Ihre Frage ein...",
                              label_visibility="hidden", key="user_input", help=None)

with col3:
    submit = st.button("Senden")

if submit:
    dialog(user_input=user_input)