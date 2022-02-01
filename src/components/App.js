import React, { useState, useEffect, useRef } from "react";
import Rating from "react-rating";
import axios from "axios";
import _ from "lodash";
import styles from "./App.scss";

const App = (props) => {
  const searchQuery = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get("q");

    return query;
  };

  const [query, setQuery] = useState(searchQuery());
  const [firstQuery, setFirstQuery] = useState("");
  const [results, setResults] = useState([]);
  const [lawpathAnswers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchType, setType] = useState("all");
  const [resultSet, setResultSet] = useState("");
  const [hasNextPage, setHasNextPage] = useState(true);
  const [totalResults, setTotalResults] = useState(0);
  const [pageNumber, setPage] = useState(1);
  const [visible, setVisible] = useState(false);
  const [windowHeight, setWindowHeight] = useState(typeof window !== "undefined" ? window.innerHeight : null);
  const focusSearch = useRef(null);
  const loadRef = useRef();

  useEffect(() => {
    focusSearch.current.focus();
  }, []);

  useEffect(() => {
    console.log(`is visible ${visible}`);

    if (visible && results.length > 0) {
      console.log("load results");
      if (hasNextPage) {
        setPage(pageNumber + 1);
      }
    }
  }, [visible]);

  const isVisible = () => {
    const top = loadRef.current.getBoundingClientRect().top - 1000;

    console.log(windowHeight);
    console.log(top);

    if (top >= 0 && top <= windowHeight) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  };

  const debounce = (func, delay) => {
    let timeout = null;
    return function () {
      window.clearTimeout(timeout);
      timeout = window.setTimeout(function () {
        func();
      }, delay);
    };
  };

  useEffect(() => {
    console.log("here");
    if (loadRef.current) {
      setWindowHeight(window.innerHeight);
      isVisible();
      window.addEventListener("scroll", debounce(isVisible, 200));
    }

    return () => window.removeEventListener("scroll", isVisible);
  }, [loadRef]);

  const getSearchResults = async (query) => {
    const smart = firstQuery === "" ? "yes" : "no";
    const results = await axios.get(`https://prod-search-service.lawpath.net/search?source=website&query=${query}&type=${searchType}&page=${pageNumber}&smart=${smart}`);
    const searchData = results.data;
    console.log(searchData);
    console.log(window.location);
    if (searchData.lawpathSuggests.length > 0) {
      setAnswers(searchData.lawpathSuggests);
    }

    return searchData;
  };

  const handleChange = (e) => {
    setQuery(e.target.value);
  };

  const sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  useEffect(() => {
    let currentQuery = true;
    const controller = new AbortController();

    const loadResults = async () => {
      if (!query) return setResults([]);
      setResults([]);
      setAnswers([]);
      setLoading(true);
      setVisible(false);
      await sleep(350);
      if (currentQuery) {
        setLoading(false);
        const searchResults = await getSearchResults(query, controller);
        if (firstQuery === "") {
          setFirstQuery(query);
        }
        setResults(searchResults.results);
        setTotalResults(searchResults.totalHits);
        setResultSet(searchResults.resultSet);
        setHasNextPage(searchResults.hasNextPage);
        console.log(searchResults);
      }
    };
    loadResults();

    return () => {
      currentQuery = false;
      controller.abort();
    };
  }, [query, searchType]);

  useEffect(() => {
    let currentQuery = true;
    const controller = new AbortController();

    const loadResults = async () => {
      if (!query) return setResults([]);
      if (currentQuery) {
        setLoading(false);
        const searchResults = await getSearchResults(query, controller);
        setResults(_.concat(results, searchResults.results));
        setTotalResults(searchResults.totalHits);
        setResultSet(searchResults.resultSet);
      }
    };
    loadResults();

    return () => {
      currentQuery = false;
      controller.abort();
    };
  }, [pageNumber]);

  const onFormSubmit = (e) => {
    e.preventDefault();
  };

  const selectType = (t) => {
    setPage(1);
    setType(t);
  };

  const lawpathSuggestions =
    lawpathAnswers.length > 0 &&
    lawpathAnswers.map((a, index) => {
      return (
        <div className={`${styles.LawpathAnswer}`}>
          <div className={`card-body ${styles.LawpathAnswer__wrapper}`}>
            <p className="card-text">
              <span className={`${styles.LawpathAnswer__text}`} dangerouslySetInnerHTML={{ __html: a.excerpt }} />
            </p>
            <a href={a.itemUrl} className="card-link">
              Read more: {a.title}
            </a>
          </div>
        </div>
      );
    });

  let searchResults =
    results.length > 0 &&
    results.map((r, index) => {
      return (
        <div className={`${styles.LawpathSearchResult}`}>
          <div className="row">
            <div className="col-12">
              <div className={`${styles.LawpathSearchResult__category}`}>
                <div className={`${styles.LawpathSearchResult__categoryIcon}`}>
                  <img src={r.icon} />
                </div>
                <div className={`${styles.LawpathSearchResult__categoryText}`}>{r.category}</div>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-12">
              <h5 className={`${styles.LawpathSearchResult__title}`}>
                <a href={r.itemUrl}>{r.title}</a>
              </h5>
              <p className={`${styles.LawpathSearchResult__relevance}`}>
                <small>Relevance:</small>
                <Rating
                  initialRating={r.relevance}
                  readonly
                  fullSymbol={{
                    display: "inline-block",
                    borderRadius: "50%",
                    border: "2px double white",
                    width: 15,
                    height: 15,
                    backgroundColor: "green",
                  }}
                  emptySymbol={{
                    display: "inline-block",
                    borderRadius: "50%",
                    border: "2px double white",
                    width: 15,
                    height: 15,
                    backgroundColor: "gray",
                  }}
                />
              </p>
              <p className={`${styles.LawpathSearchResult__excerpt}`}>
                <span dangerouslySetInnerHTML={{ __html: r.excerpt }} />
              </p>
            </div>
          </div>
        </div>
      );
    });

  return (
    <div className="container mt-2">
      <div className={styles.LawpathSearch}>
        <div className={styles.LawpathSearchBox}>
          <div className="row">
            <div className="col-4 pt-3 d-none d-lg-block">
              <img src="https://assets.lawpath.com/images/lawpath-illustrations/lawpath-search.png" />
            </div>
            <div className="col-sm-12 col-lg-8">
              <div className="row">
                <div className="col-12">
                  <form id="search-form" className="mt-5 pt-2 ml-3" onSubmit={onFormSubmit}>
                    <input
                      type="text"
                      ref={focusSearch}
                      onChange={(e) => handleChange(e)}
                      value={query}
                      className={`${styles.LawpathSearchBox__searchInput} form-control-lg`}
                      placeholder="Ask Lawpath ..."
                    />
                  </form>
                </div>
              </div>
              <div className="row">
                <div className="col-12">
                  <ul className={styles.LawpathSearchOptions}>
                    <li onClick={() => selectType("all")} className={searchType === "all" ? styles.LawpathSearchOptions__selected : ""}>
                      All
                    </li>
                    <li onClick={() => selectType("blog")} className={searchType === "blog" ? styles.LawpathSearchOptions__selected : ""}>
                      Articles
                    </li>
                    <li onClick={() => selectType("document")} className={searchType === "document" ? styles.LawpathSearchOptions__selected : ""}>
                      Documents
                    </li>
                    <li onClick={() => selectType("solution")} className={searchType === "solution" ? styles.LawpathSearchOptions__selected : ""}>
                      Solutions
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-12">
            {results.length > 0 && (
              <div className="row">
                <div className="col-12 mt-2">
                  {lawpathAnswers.length > 0 && (
                    <div className={styles.LawpathSearch__answers}>
                      <div className="card">
                        <div className={`card-header ${styles.LawpathSearch__answerHeader}`}>
                          <img src="https://assets.lawpath.com/app/documents/lightbulb.png" /> <strong>Lawpath recommends</strong>
                        </div>
                        {lawpathSuggestions}
                      </div>
                    </div>
                  )}
                  <div className="col-12 mt-2">
                    <h3 className={styles.LawpathSearch__results}>
                     {lawpathAnswers.length > 0 ? "Also found" : "Showing" } {totalResults} results for '{query}' in {resultSet}
                    </h3>
                  </div>
                  <div>{searchResults}</div>
                  <div>
                    <button
                      className="btn-block btn-secondary p-3 mb-5 d-none"
                      onClick={() => {
                        setPage(pageNumber + 1);
                      }}
                    >
                      Load more results
                    </button>
                  </div>
                </div>
              </div>
            )}
            {(loading || firstQuery === "") && (
                <div className="row">
                  <div className="col-12">
                    <div className={styles.LawpathSearchDefault}>
                      <img className={styles.LawpathSearchLoading} src="https://assets.lawpath.com/images/loaders/lawpath-search.gif" />
                    </div>
                  </div>
                </div>
              )}
            {(results.length === 0 || results.totalHits === 0) && !loading && firstQuery !== "" && (
              <div className="row">
                <div className="col-12">
                  <div className={styles.LawpathSearchDefault}>
                    <div className="mt-5 pt-5">
                      <img src="https://assets.lawpath.com/images/lawpath-illustrations/search-lawpath.png" />
                      <h2>Search Lawpath for documents, articles and legal solutions</h2>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div style={{ color: "#fff" }} ref={loadRef}>
              x
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
