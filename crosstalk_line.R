sd_full <- SharedData$new(iris, key = ~rownames(iris))# key by Species, not row number

sd_chart <- iris |>
  dplyr::group_by(Species) |>
  # dplyr::summarise(
  #   Sepal.Length = mean(Sepal.Length),
  #   Sepal.Width  = mean(Sepal.Width)
  # ) |>
  SharedData$new(
    key =  ~rownames(iris),
    group = sd_full$groupName()
  )

sd_chart |>
  # group_by(Species) |>
  e_charts(Sepal.Length, timeline = TRUE) |>
  e_line(Sepal.Width)

bscols(
  sd_chart |>
  # group_by(Species) |>
  e_charts(Sepal.Length) |>
  e_line(Sepal.Width,
         selectedMode = "single",
         emphasis = list(
           focus='self', blurScope='series'
         ),
         blur = list(
           itemStyle = list(
             opacity = 0.3          # dim non-selected bars strongly
           )),
         datasetId = "Xtalk") |> e_toolbox_feature() |> e_brush(),
datatable(sd_full)
)

print(e$x$opts$series[[1]]$data[1:3])


sd_full |>
  # group_by(Species) |>
  e_charts(Sepal.Length) |>
  e_line(Sepal.Width)
