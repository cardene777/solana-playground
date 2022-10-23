import { FC, useCallback, useEffect, useRef, useState } from "react";
import styled, { css } from "styled-components";

import Button from "../Button";
import Markdown from "./Markdown";
import EditorWithTabs from "../Panels/Main/MainView/EditorWithTabs";
import { TAB_HEIGHT } from "../Panels/Main/MainView/Tabs";
import { Sidebar } from "../Panels/Side/sidebar-state";
import { PgExplorer, PgRouter, PgView } from "../../utils/pg";
import { Route } from "../../constants";
import { PointedArrow } from "../Icons";
import { TutorialComponentProps, TutorialData } from "./types";
import { useAtom } from "jotai";
import { tutorialAtom } from "../../state";

export const Tutorial: FC<TutorialComponentProps> = ({
  about,
  pages,
  files,
  defaultOpenFile,
  reverseLayout,
}) => {
  const [tutorial] = useAtom<TutorialData>(tutorialAtom as any);

  const [currentPage, setCurrentPage] = useState(0);

  const previousPageRef = useRef(currentPage);

  const goBackToTutorials = useCallback(() => {
    PgView.setSidebarState(Sidebar.TUTORIALS);
    PgRouter.navigate(Route.TUTORIALS);
  }, []);
  const nextPage = useCallback(() => {
    setCurrentPage((c) => c + 1);
  }, []);
  const previousPage = useCallback(() => {
    setCurrentPage((c) => c - 1);
  }, []);
  const startTutorial = useCallback(async () => {
    const explorer = await PgExplorer.get();
    const tutorialWorkspaceName = tutorial.name;
    if (explorer.allWorkspaceNames?.includes(tutorialWorkspaceName)) {
      console.log(1);
      // Start from where the user left off
      if (explorer.currentWorkspaceName !== tutorialWorkspaceName) {
        await explorer.changeWorkspace(tutorialWorkspaceName);
      }
    } else {
      console.log(2);
      // Initial tutorial setup
      await explorer.newWorkspace(tutorialWorkspaceName, {
        files,
        defaultOpenFile:
          files.length > 0 ? defaultOpenFile ?? files[0][0] : undefined,
      });
    }

    PgView.setSidebarState(Sidebar.EXPLORER);
    setCurrentPage(1);
  }, [files, defaultOpenFile, tutorial.name]);

  useEffect(() => {
    const disposable = PgView.onDidChangeSidebarState((state) => {
      if (currentPage !== 0) {
        previousPageRef.current = currentPage;
      }

      if (state === Sidebar.TUTORIALS) {
        setCurrentPage(0);
      } else if (previousPageRef.current !== 0) {
        setCurrentPage(previousPageRef.current);
      }
    });

    return () => disposable.dispose();
  }, [currentPage]);

  return (
    <Wrapper>
      {currentPage === 0 ? (
        <MainWrapper>
          <GoBackButtonWrapper>
            <Button
              onClick={goBackToTutorials}
              kind="no-border"
              leftIcon={<PointedArrow rotate="180deg" />}
            >
              Back
            </Button>
          </GoBackButtonWrapper>
          <TutorialTopSectionWrapper>
            <TutorialName>{tutorial.name}</TutorialName>
            <TutorialDescriptionWrapper>
              <TutorialDescription>{tutorial.description}</TutorialDescription>
              <StartTutorialButtonWrapper>
                <Button
                  onClick={startTutorial}
                  kind="secondary"
                  fontWeight="bold"
                >
                  START
                </Button>
              </StartTutorialButtonWrapper>
            </TutorialDescriptionWrapper>
          </TutorialTopSectionWrapper>
          <Markdown>{about}</Markdown>
        </MainWrapper>
      ) : (
        <PagesWrapper reverseLayout={reverseLayout}>
          <EditorWrapper>
            <EditorWithTabs />
          </EditorWrapper>
          <Resizeable>
            <Markdown>{pages[currentPage - 1].content}</Markdown>
            <NavigationButtonsOutsideWrapper>
              <NavigationButtonsInsideWrapper>
                {currentPage !== 1 && (
                  <PreviousWrapper>
                    <PreviousText>Previous</PreviousText>
                    <Button
                      onClick={previousPage}
                      kind="no-border"
                      fontWeight="bold"
                      leftIcon={<PointedArrow rotate="180deg" />}
                    >
                      {pages[currentPage - 2].title}
                    </Button>
                  </PreviousWrapper>
                )}
                {currentPage !== pages.length && (
                  <NextWrapper>
                    <NextText>Next</NextText>
                    <Button
                      onClick={nextPage}
                      kind="no-border"
                      fontWeight="bold"
                      rightIcon={<PointedArrow />}
                    >
                      {pages[currentPage].title}
                    </Button>
                  </NextWrapper>
                )}
              </NavigationButtonsInsideWrapper>
            </NavigationButtonsOutsideWrapper>
          </Resizeable>
        </PagesWrapper>
      )}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    flex: 1;
    overflow: auto;
    background-color: ${theme.colors.tutorial?.bg};
    color: ${theme.colors.tutorial?.color};

    /* Scrollbar */
    /* Chromium */
    & ::-webkit-scrollbar {
      width: 0.5rem;
      height: 0.5rem;
    }

    & ::-webkit-scrollbar-track {
      background-color: transparent;
    }

    & ::-webkit-scrollbar-thumb {
      border: 0.25rem solid transparent;
      border-radius: ${theme.borderRadius};
      background-color: ${theme.scrollbar?.thumb.color};
    }

    & ::-webkit-scrollbar-thumb:hover {
      background-color: ${theme.scrollbar?.thumb.hoverColor};
    }

    /* Firefox */
    & * {
      scrollbar-color: ${theme.scrollbar?.thumb.color};
    }
  `}
`;

const MainWrapper = styled.div`
  height: 100%;
  width: 100%;
  overflow: auto;
`;

const GoBackButtonWrapper = styled.div`
  height: ${TAB_HEIGHT};
  display: flex;
  align-items: center;
  padding-left: 1rem;

  & svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`;

const TutorialTopSectionWrapper = styled.div`
  ${({ theme }) => css`
    font-family: ${theme.font?.other?.family};
    font-size: ${theme.font?.other?.size.medium};
    background-color: ${theme.colors.markdown?.bg};
    color: ${theme.colors.markdown?.color};
    padding: 1.5rem 2rem;
    max-width: 60rem;
    border-top-right-radius: ${theme.borderRadius};
    border-bottom-right-radius: ${theme.borderRadius};
  `}
`;

const TutorialName = styled.h1``;

const TutorialDescriptionWrapper = styled.div`
  margin-top: 1.5rem;
  display: flex;
  justify-content: space-between;
`;

const TutorialDescription = styled.div`
  color: ${({ theme }) => theme.colors.default.textSecondary};
  max-width: 85%;
`;

const StartTutorialButtonWrapper = styled.div`
  margin-left: 2rem;
`;

const PagesWrapper = styled.div<Pick<TutorialComponentProps, "reverseLayout">>`
  display: flex;
  flex-direction: ${({ reverseLayout }) =>
    reverseLayout ? "row-reverse" : "row"};
  width: 100%;
  overflow: auto;
  height: -webkit-fill-available;
  max-height: 100%;

  & > div {
    width: 50%;
  }
`;

const EditorWrapper = styled.div`
  display: flex;
  flex-direction: column;

  & > div:nth-child(2) {
    flex: 1;
  }
`;

const Resizeable: FC = ({ children }) => (
  <ResizeableWrapper>{children}</ResizeableWrapper>
);

const ResizeableWrapper = styled.div`
  height: 100%;
  overflow: auto;
  padding-top: ${TAB_HEIGHT};
  font-family: ${({ theme }) => theme.font?.other?.family};
`;

const NavigationButtonsOutsideWrapper = styled.div`
  padding: 3rem 2rem;
  background-color: ${({ theme }) => theme.colors.markdown?.bg};
`;

const NavigationButtonsInsideWrapper = styled.div`
  ${({ theme }) => css`
    display: flex;
    width: 100%;
    padding-top: 1.5rem;
    font-weight: bold;
    border-top: 1px solid ${theme.colors.default.borderColor};

    & button {
      margin-top: 0.5rem;
      font-size: ${theme.font?.code?.size.large};

      & svg {
        width: 1.25rem;
        height: 1.25rem;
      }
    }
  `}
`;

const PreviousWrapper = styled.div`
  width: 100%;
`;

const PreviousText = styled.div``;

const NextWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  width: 100%;
`;

const NextText = styled.div``;