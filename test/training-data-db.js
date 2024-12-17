[ 
    {
    "description": "Get the last letter of a text input",
    "blocks": {
      "languageVersion": 0,
      "blocks": [
        {
          "type": "variables_set",
          "id": "3P`0$ELrs53K`2rhNM/_",
          "x": -637,
          "y": 63,
          "fields": {
            "VAR": {
              "id": "|plj]6yG086!rV!`UKq*"
            }
          },
          "inputs": {
            "VALUE": {
              "block": {
                "type": "text_prompt_ext",
                "id": "$vZxdWS5LO[gOr]:)s-2",
                "extraState": "<mutation type=\"TEXT\"></mutation>",
                "fields": {
                  "TYPE": "TEXT"
                },
                "inputs": {
                  "TEXT": {
                    "shadow": {
                      "type": "text",
                      "id": "?2X(yC|]70k-g^n@yN|`",
                      "fields": {
                        "TEXT": "abc"
                      }
                    },
                    "block": {
                      "type": "text",
                      "id": "{/PJ*{D@15A9gf|?MtR!",
                      "fields": {
                        "TEXT": ""
                      }
                    }
                  }
                }
              }
            }
          },
          "next": {
            "block": {
              "type": "text_print",
              "id": "Xx[iO[W:g_QX}zp`wd@:",
              "inputs": {
                "TEXT": {
                  "shadow": {
                    "type": "text",
                    "id": "x-Fv@VT(kb{f+1~5?-%)",
                    "fields": {
                      "TEXT": "abc"
                    }
                  },
                  "block": {
                    "type": "text_charAt",
                    "id": "*;1eydda$?Q_-v]32j,p",
                    "extraState": "<mutation at=\"false\"></mutation>",
                    "fields": {
                      "WHERE": "LAST"
                    },
                    "inputs": {
                      "VALUE": {
                        "block": {
                          "type": "variables_get",
                          "id": ",r|pnnAQ,!J3*Ha!P^L?",
                          "fields": {
                            "VAR": {
                              "id": "|plj]6yG086!rV!`UKq*"
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      ]
    },
    "variables": [
      {
        "name": "text",
        "id": "|plj]6yG086!rV!`UKq*"
      }
    ]
  },
  {
    "description": "Get 3rd item in a list of inputs",
    "blocks": {
      "languageVersion": 0,
      "blocks": [
        {
          "type": "variables_set",
          "id": "]Nf%E,`Wgm`xLXb/%}L/",
          "x": -762,
          "y": 163,
          "fields": {
            "VAR": {
              "id": "qTLspX#{dp.LzE~I`$(,"
            }
          },
          "inputs": {
            "VALUE": {
              "block": {
                "type": "lists_split",
                "id": "H?Q)qE-a2AT!d!10C!L_",
                "fields": {
                  "MODE": "SPLIT"
                },
                "inputs": {
                  "INPUT": {
                    "block": {
                      "type": "text_prompt_ext",
                      "id": "#]1q%@g]*==91^-mf#IH",
                      "extraState": "<mutation type=\"TEXT\"></mutation>",
                      "fields": {
                        "TYPE": "TEXT"
                      },
                      "inputs": {
                        "TEXT": {
                          "shadow": {
                            "type": "text",
                            "id": "bv=to]c}mUY9!Q58^)`?",
                            "fields": {
                              "TEXT": "abc"
                            }
                          },
                          "block": {
                            "type": "text",
                            "id": "aXvT{1h]UDqu[Fv_F3yp",
                            "fields": {
                              "TEXT": ""
                            }
                          }
                        }
                      }
                    }
                  },
                  "DELIM": {
                    "shadow": {
                      "type": "text",
                      "id": "l7Lr~/=/dfim:$gg:sGJ",
                      "fields": {
                        "TEXT": ","
                      }
                    }
                  }
                }
              }
            }
          },
          "next": {
            "block": {
              "type": "text_print",
              "id": "rhcD@*6(MFFzi]BaB0U=",
              "inputs": {
                "TEXT": {
                  "shadow": {
                    "type": "text",
                    "id": "7PhKv?,wXWr%v:Iy4PU[",
                    "fields": {
                      "TEXT": "abc"
                    }
                  },
                  "block": {
                    "type": "lists_getIndex",
                    "id": "=BQ85@U+Un*BF[M_HfZ{",
                    "fields": {
                      "MODE": "GET",
                      "WHERE": "FROM_START"
                    },
                    "inputs": {
                      "VALUE": {
                        "block": {
                          "type": "variables_get",
                          "id": "*j=!WDBm0s}m]n0TlGT$",
                          "fields": {
                            "VAR": {
                              "id": "qTLspX#{dp.LzE~I`$(,"
                            }
                          }
                        }
                      },
                      "AT": {
                        "block": {
                          "type": "math_number",
                          "id": "RWkACqD1nvNzXjJ~7h5;",
                          "fields": {
                            "NUM": 3
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      ]
    },
    "variables": [
      {
        "name": "text",
        "id": "|plj]6yG086!rV!`UKq*"
      },
      {
        "name": "list",
        "id": "qTLspX#{dp.LzE~I`$(,"
      }
    ]
  }]

/* to add in index.js: importNaiveBayesClassifier, const trainingdata = JSON.parse(training-data-db.json),
NaiveBayesClassifier.train(trainingdata) */
  
  