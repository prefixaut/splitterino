import { expect } from 'chai';
import { ActionContext, Module } from 'vuex';
import { getModuleActionAndMutationNames } from '../../../src/utils/store';

describe('getModuleActionAndMutationNames', () => {
    it('should get the names without namespace', () => {
        const testModule: Module<any, any> = {
            state: {
                hi: 456,
            },
            actions: {
                action(context: ActionContext<any, any>) {
                    context.commit('mutation');

                    return { test: 123 };
                },
            },
            mutations: {
                mutation(state: any) {
                    state.hi = 890;
                }
            },
        };
        const expectedNames = {
            actions: ['test/action'],
            mutations: ['test/mutation'],
        };

        const actualNames = getModuleActionAndMutationNames(testModule, 'test');

        expect(actualNames).to.deep.equal(expectedNames);
    });

    it('should get the names with namespace', () => {
        const testModule: Module<any, any> = {
            namespaced: true,
            state: {
                hi: 456,
            },
            actions: {
                action(context: ActionContext<any, any>) {
                    context.commit('mutation');

                    return { test: 123 };
                },
            },
            mutations: {
                mutation(state: any) {
                    state.hi = 890;
                }
            },
        };
        const expectedNames = {
            actions: ['namespace/something/test/action'],
            mutations: ['namespace/something/test/mutation'],
        };

        const actualNames = getModuleActionAndMutationNames(testModule, 'test', 'namespace/something');

        expect(actualNames).to.deep.equal(expectedNames);
    });

    it('should get the nested names without namespace', () => {
        const testModule: Module<any, any> = {
            state: {
                hi: 456,
            },
            actions: {
                action(context: ActionContext<any, any>) {
                    context.commit('mutation');

                    return { test: 123 };
                },
            },
            mutations: {
                mutation(state: any) {
                    state.hi = 890;
                }
            },
            modules: {
                submodule1: {
                    state: {
                        hi: 123,
                    },
                    actions: {
                        foo(context: ActionContext<any, any>) {
                            context.commit('bar');

                            return { hi: 789 };
                        }
                    },
                    mutations: {
                        bar(state: any) {
                            state.hi = 'abc';
                        }
                    },
                },
                submodule2: {
                    state: {
                        something: 123,
                    },
                    actions: {
                        iRanOutOfNames() {
                            return { help: 9284 };
                        }
                    },
                    mutations: {
                        sendMeADictionary(state: any) {
                            state.something = 'bla';
                        }
                    },
                    modules: {
                        anotherOne: {
                            actions: {
                                hydrogen() {
                                    return 'empty?';
                                }
                            },
                            mutations: {
                                oxygen(state: any) {
                                    state.foo = 'nothing';
                                }
                            }
                        }
                    }
                }
            }
        };
        const expectedNames = {
            actions: [
                'test/action',
                'test/foo',
                'test/iRanOutOfNames',
                'test/hydrogen',
            ],
            mutations: [
                'test/mutation',
                'test/bar',
                'test/sendMeADictionary',
                'test/oxygen',
            ],
        };

        const actualNames = getModuleActionAndMutationNames(testModule, 'test');

        expect(actualNames).to.deep.equal(expectedNames);
    });

    it('should get the nested names with namespace', () => {
        const testModule: Module<any, any> = {
            namespaced: true,
            state: {
                hi: 456,
            },
            actions: {
                action(context: ActionContext<any, any>) {
                    context.commit('mutation');

                    return { test: 123 };
                },
            },
            mutations: {
                mutation(state: any) {
                    state.hi = 890;
                }
            },
            modules: {
                submodule1: {
                    namespaced: true,
                    state: {
                        hi: 123,
                    },
                    actions: {
                        foo(context: ActionContext<any, any>) {
                            context.commit('bar');

                            return { hi: 789 };
                        }
                    },
                    mutations: {
                        bar(state: any) {
                            state.hi = 'abc';
                        }
                    },
                },
                submodule2: {
                    namespaced: true,
                    state: {
                        something: 123,
                    },
                    actions: {
                        iRanOutOfNames() {
                            return { help: 9284 };
                        }
                    },
                    mutations: {
                        sendMeADictionary(state: any) {
                            state.something = 'bla';
                        }
                    },
                    modules: {
                        anotherOne: {
                            namespaced: true,
                            actions: {
                                hydrogen() {
                                    return 'empty?';
                                }
                            },
                            mutations: {
                                oxygen(state: any) {
                                    state.foo = 'nothing';
                                }
                            }
                        }
                    }
                }
            }
        };
        const expectedNames = {
            actions: [
                'namespace/something/test/action',
                'namespace/something/test/submodule1/foo',
                'namespace/something/test/submodule2/iRanOutOfNames',
                'namespace/something/test/submodule2/anotherOne/hydrogen',
            ],
            mutations: [
                'namespace/something/test/mutation',
                'namespace/something/test/submodule1/bar',
                'namespace/something/test/submodule2/sendMeADictionary',
                'namespace/something/test/submodule2/anotherOne/oxygen',
            ],
        };

        const actualNames = getModuleActionAndMutationNames(testModule, 'test', 'namespace/something');

        expect(actualNames).to.deep.equal(expectedNames);
    });

    it('should get the nested names with mixed namespace', () => {
        const testModule: Module<any, any> = {
            namespaced: true,
            state: {
                hi: 456,
            },
            actions: {
                action(context: ActionContext<any, any>) {
                    context.commit('mutation');

                    return { test: 123 };
                },
            },
            mutations: {
                mutation(state: any) {
                    state.hi = 890;
                }
            },
            modules: {
                submodule1: {
                    namespaced: true,
                    state: {
                        hi: 123,
                    },
                    actions: {
                        foo(context: ActionContext<any, any>) {
                            context.commit('bar');

                            return { hi: 789 };
                        }
                    },
                    mutations: {
                        bar(state: any) {
                            state.hi = 'abc';
                        }
                    },
                },
                submodule2: {
                    state: {
                        something: 123,
                    },
                    actions: {
                        iRanOutOfNames() {
                            return { help: 9284 };
                        }
                    },
                    mutations: {
                        sendMeADictionary(state: any) {
                            state.something = 'bla';
                        }
                    },
                    modules: {
                        anotherOne: {
                            namespaced: true,
                            actions: {
                                hydrogen() {
                                    return 'empty?';
                                }
                            },
                            mutations: {
                                oxygen(state: any) {
                                    state.foo = 'nothing';
                                }
                            }
                        }
                    }
                }
            }
        };
        const expectedNames = {
            actions: [
                'namespace/something/test/action',
                'namespace/something/test/submodule1/foo',
                'namespace/something/test/iRanOutOfNames',
                'namespace/something/test/anotherOne/hydrogen',
            ],
            mutations: [
                'namespace/something/test/mutation',
                'namespace/something/test/submodule1/bar',
                'namespace/something/test/sendMeADictionary',
                'namespace/something/test/anotherOne/oxygen',
            ],
        };

        const actualNames = getModuleActionAndMutationNames(testModule, 'test', 'namespace/something');

        expect(actualNames).to.deep.equal(expectedNames);
    });
});
